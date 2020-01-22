from bs4 import BeautifulSoup
import requests
from zhconv import convert

# get page
def get_page(url):
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"})
    return response.text
wiki_url = """https://zh.wikipedia.org/wiki/2019年%EF%BC%8D2020年新型冠狀病毒肺炎事件"""
soup = BeautifulSoup(get_page(wiki_url), 'lxml')

# get tables
tables = soup.find_all("table", class_="wikitable")
world_table = tables[0]
china_table = tables[1]

# convert table to data
def table_to_data(table):
    data = [[convert(cell.text.strip(), 'zh-cn') for cell in row.find_all("td")] for row in table.find_all("tr")]
    data[0] = [convert(cell.text.strip(), 'zh-cn') for cell in table.find("tr").find_all("th")]
    return data
world_data = table_to_data(world_table)
for t in world_data:
    print(t)
china_data = table_to_data(china_table)
# for t in china_data:
#     print(t)

# normalize china data
for i in range(1, len(china_data)):
    row = china_data[i]
    if 4 == len(row):
        place = row[0]
        date = row[1]
        source = row[3]
        continue
    elif 3 == len(row):
        china_data[i].insert(0, place)
    elif 2 == len(row):
        if "20" == row[0][:2]:
            china_data[i].insert(2, source)
            china_data[i].insert(0, place)
        else:
            china_data[i][0:0] = (place, date)
    elif 1 == len(row):
        china_data[i].insert(1, source)
        china_data[i][0:0] = (place, date)
    else:
        print(row)
    row = china_data[i]
    place = row[0]
    date = row[1]
    source = row[3]
# for t in china_data:
#     print(t)

import pandas as pd

df = pd.DataFrame(data=china_data[1:], columns=["place", "date", "desc", "source"])
df['date'] = pd.to_datetime(df['date'])
print(df.head())
# get the latest news
latest_index = df.groupby('place', sort=False).date.tail(1).index

import jieba
import jieba.posseg as pseg
confirm_dict = dict()
for i in latest_index:
    # print(df.loc[i])
    s = df.loc[i].desc
    words = pseg.cut(s, use_paddle=True)
    res = []
    for word, flag in words:
        if word[-1:] == '例' and flag == 'm':
            # print("%s %s" % (word, flag))
            if word[:-1].isdigit():
                res.append(int(word[:-1]))
            else:
                res.append(1)
    num_confirmed = 1 if not res else max(res)
    print(df.loc[i].place, num_confirmed)
    confirm_dict[df.loc[i].place] = num_confirmed
print(confirm_dict)

import json
confirm_json = json.dumps(confirm_dict, ensure_ascii=False)
print(type(confirm_json))
print(confirm_json)