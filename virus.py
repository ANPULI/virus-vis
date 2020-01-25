from bs4 import BeautifulSoup
import requests
from zhconv import convert
import pandas as pd
import re
import json

def get_page(url):
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"})
    return response.text

def table_to_data(table):
    data = [[convert(cell.text.strip(), 'zh-cn') for cell in row.find_all("td")] for row in table.find_all("tr")]
    data[0] = [convert(cell.text.strip(), 'zh-cn') for cell in table.find_all("tr")[0].find_all("th")]
    data[1] = [convert(cell.text.strip(), 'zh-cn') for cell in table.find_all("tr")[1].find_all("th")]
    return data

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
    first_row = rows[0].find_all()
    col_num = 0
    # use first row to get the column number
    for cell in first_row:
        col_num += int(cell.attrs.get('colspan', 1))
    row_num = len(rows)
    return col_num, row_num

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

def make_confirm_dict(df_china):
    confirm_dict = dict()
    for i in df_china.index:
        place = df_china.loc[i].place
        desc = df_china.loc[i].desc
        res = re.search('累计[0-9]+例', desc)
        if not res:
            res = re.search('共出现[0-9]+例', desc)
        if not res:
            num_confirmed = 1
        else:
            num_confirmed = int(re.search(r'\d+', res.group()).group())
        confirm_dict[place] = max(num_confirmed, confirm_dict.get(place, 0))
    return confirm_dict

def dict_to_json(confirm_dict):
    res = []
    for k, v in confirm_dict.items():
        print(k ,v)
        res.append({"name": k, "value": v})
    return res

# get page
wiki_url = """https://zh.wikipedia.org/wiki/%E6%96%B0%E5%9E%8B%E5%86%A0%E7%8B%80%E7%97%85%E6%AF%92%E8%82%BA%E7%82%8E%E5%85%A8%E7%90%83%E7%96%AB%E6%83%85%E7%97%85%E4%BE%8B"""
soup = BeautifulSoup(get_page(wiki_url), 'lxml')

# get tables
tables = soup.find_all("table", class_="wikitable")
print(tables)
world_table = tables[0]
china_table = tables[1]

# convert table to data
world_data = table_to_data(world_table)
china_data = table_to_data(china_table)
china_data = normalize_data(china_data)

# store as dataframe
df_china = pd.DataFrame(data=china_data[1:], columns=["place", "date", "desc", "source"])
df_china['date'] = pd.to_datetime(df_china['date'])
# print(df_china.head())
# get the latest news
latest_index = df_china.groupby('place', sort=False).date.tail(1).index

# make dict of {place: number of confirmed cases}
confirm_dict = make_confirm_dict(df_china)  
print(confirm_dict)
# convert dict to json
confirm_json = json.dumps(dict_to_json(confirm_dict), ensure_ascii=False)
print(type(confirm_json))
print(confirm_json)
