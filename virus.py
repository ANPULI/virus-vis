from bs4 import BeautifulSoup
import requests
from zhconv import convert
import re
import json
from flask import Flask, Response
from flask_cors import CORS, cross_origin
import os
import datetime

app = Flask(__name__)


def get_page(url):
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"})
    return response.text

''' deprecated
def table_to_data(table):
    data = [[convert(cell.text.strip(), 'zh-cn') for cell in row.find_all("td")] for row in table.find_all("tr")]
    data[0] = [convert(cell.text.strip(), 'zh-cn') for cell in table.find("tr").find_all("th")]
    return data

def normalize_data(data):
    for i in range(1, len(data)):
        row = data[i]
        if 4 == len(row):
            place = row[0]
            date = row[1]
            source = row[3]
            continue
        elif 3 == len(row):
            data[i].insert(0, place)
        elif 2 == len(row):
            if "20" == row[0][:2]:
                data[i].insert(2, source)
                data[i].insert(0, place)
            else:
                data[i][0:0] = (place, date)
        elif 1 == len(row):
            data[i].insert(1, source)
            data[i][0:0] = (place, date)
        else:
            print(row)
        row = data[i]
        place = row[0]
        date = row[1]
        source = row[3]
    return data

def make_confirm_dict(china_data):
    confirm_dict = dict()
    for i in range(len(china_data)):
        place = china_data[i][0]
        desc = china_data[i][2]
        res = re.search('累计[0-9]+例', desc)
        if not res:
            res = re.search('共出现[0-9]+例', desc)
        if not res:
            num_confirmed = 1
        else:
            num_confirmed = int(re.search(r'\d+', res.group()).group())
        confirm_dict[place] = max(num_confirmed, confirm_dict.get(place, 0))
    return confirm_dict
'''

def dict_to_json(confirm_dict):
    res = []
    for k, v in confirm_dict.items():
        # print(k ,v)
        res.append({"name": k, "value": v})
    return res

def t2d(table):
    # try to solve rowspan / colspan
    rows = table.find_all("tr")
    col_num, row_num = get_col_row_num(rows)
    # print(col_num, row_num)
    res = [[-1 for i in range(col_num)] for j in range(row_num)]
    i = 0
    # i-th row, j-th column
    for row in rows:
        j = 0
        cells = row.find_all(["th", "td"])
        for cell in cells:
            value = cell.text.strip()
            while j < col_num and res[i][j] != -1:
                j += 1
            if col_num == j:
                break
            col_span, row_span = int(cell.attrs.get('colspan', 1)), int(cell.attrs.get('rowspan', 1))
            value = int(value) if value.isdigit() else convert(value, 'zh-cn')
            res[i][j] = value  # current cell
            for k in range(1, row_span):
                res[i+k][j] = value  # down
            for k in range(1, col_span):
                j += 1
                res[i][j] = value  # right
            j += 1
        i += 1
    return res      

def get_col_row_num(rows):
    first_row = rows[0].find_all('th')
    col_num = 0
    # use first row to get the column number
    for cell in first_row:
        print(cell)
        col_num += int(cell.attrs.get('colspan', 1))
    row_num = len(rows)
    return col_num, row_num

def get_latest_data(data):
    keys = data[0][1:]
    values = data[-1][1:]
    res = dict()
    for i in range(len(keys)):
        res.setdefault(keys[i], []).append(values[i])
    return json.dumps(dict_to_json(res), ensure_ascii=False)

def get_all_data(data):
    num_table = len(data)
    result, daily_data = dict(), dict()
    daily_data["日期"] = [data[0][i][0] for i in range(1, len(data[0])-1)]
    names = ['确诊', '死亡', '治愈']
    for i in range(num_table):
        res = dict()
        table = data[i]
        for j in range(1, len(table)):
            date = table[j][0]
            for k in range(1, len(table[0])):
                prov = table[0][k]
                value = re.search("\d+", str(table[j][k]))
                value = int(value.group()) if value else 0
                # value = table[j][k] if table[j][k] else 0
                # try:
                #     value = int(value)
                # except:
                #     value = int(re.search("\d+", value).group())                
                res.setdefault(date, dict())[prov] = value
                if "全国" == prov and "累计" != date:
                    daily_data.setdefault(names[i], list()).append(value)
            res[date] = dict_to_json(res[date])
        result[names[i]] = res
    result["每日"] = daily_data
    return json.dumps(result, ensure_ascii=False)

    # for i in range(1, len(data[0])):
    #     res = dict()
    #     values = [data[k][i][1:] for k in range(num_table)]
    #     print("values", values)
    #     for j in range(len(provs)):
    #         print([values[k][j] if values[k][j] else 0 for k in range(num_table)])
    #         res.setdefault(provs[j], []).extend([values[k][j] if values[k][j] else 0 for k in range(num_table)])
    #     date = data[0][i][0]
    #     result[date] = dict_to_json(res)
    return json.dumps(dict_to_json(result), ensure_ascii=False)


        


def get_china_data():
    
    # get page
    wiki_url = """https://zh.wikipedia.org/wiki/2019%EF%BC%8D2020%E5%B9%B4%E6%96%B0%E5%9E%8B%E5%86%A0%E7%8B%80%E7%97%85%E6%AF%92%E8%82%BA%E7%82%8E%E4%BA%8B%E4%BB%B6"""
    world_url = """https://zh.wikipedia.org/wiki/%E6%96%B0%E5%9E%8B%E5%86%A0%E7%8B%80%E7%97%85%E6%AF%92%E8%82%BA%E7%82%8E%E5%85%A8%E7%90%83%E7%96%AB%E6%83%85%E7%97%85%E4%BE%8B"""
    china_url = """https://zh.wikipedia.org/wiki/%E6%96%B0%E5%9E%8B%E5%86%A0%E7%8B%80%E7%97%85%E6%AF%92%E8%82%BA%E7%82%8E%E4%B8%AD%E5%9C%8B%E5%A4%A7%E9%99%B8%E7%96%AB%E6%83%85%E7%97%85%E4%BE%8B"""
    soup = BeautifulSoup(get_page(china_url), 'lxml')

    # get tables
    tables = soup.find_all("table", class_="wikitable")
    # report_table = tables[0]
    for i in range(0, len(tables)):
        if "新增病例" in tables[i].caption.text:
            break
    china_table = tables[i:i+3]
    city_table = tables[i+3]

    # convert table to data
    china_data = [t2d(china_table[i]) for i in range(3)]
    city_data = t2d(city_table)
    print(city_data)
    # latest_data = get_latest_data(china_data)
    all_data = get_all_data(china_data)
    return all_data

    # make dict of {place: number of confirmed cases}
    # confirm_dict = make_confirm_dict(china_data[1:])  
    # convert dict to json
    # confirm_json = json.dumps(dict_to_json(confirm_dict), ensure_ascii=False)
    return latest_data


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
@cross_origin()
def catch_request(path):
    return get_china_data()
    # return Response("<h1>Flask on ZEIT Now</h1><p>You visited: /%s</p>" % (path), mimetype="text/html")
    # filename = os.path.join(app.static_folder, 'confirm_china.json')
    # print(filename)
    # last_mod_time = os.path.getmtime(filename)
    # current_time = calendar.timegm(time.gmtime())
    # interval_minutes = int((current_time - last_mod_time) / 60)
    # print("last modify time: %d, current time: %d, interval_minutes: %d" % (last_mod_time, current_time, interval_minutes))
    # if interval_minutes < 15:
    #     print("gap less than 15 minutes, using cache data")
    #     with open(filename, 'r', encoding='utf-8') as f:
    #         data = json.load(f)
    #     return str(data)
    # print("gap larger than 15 minutes, fetching latest data")
    # data = get_china_data()
    # with open(filename, 'w', encoding='utf-8') as f:
    #     f.write(data)
    # return data


'''# deprecated
@app.route('/world_data')
@cross_origin()
def post_world_data():
    # get page
    wiki_url = """https://zh.wikipedia.org/wiki/2019年%EF%BC%8D2020年新型冠狀病毒肺炎事件"""
    soup = BeautifulSoup(get_page(wiki_url), 'lxml')

    # get tables
    tables = soup.find_all("table", class_="wikitable")
    world_table = tables[0]
    china_table = tables[1]

    # convert table to data
    world_data = table_to_data(world_table)
    return json.dumps(world_data, ensure_ascii=False)
'''