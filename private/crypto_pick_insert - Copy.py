users = {
    '589555071348375554': ['XRP', 'ETH', 'LTC'],
    '165924625929207808': ['LTC', 'ETH', 'BTC'],
    '610341206072885248': ['RVN', 'XLM', 'CEL'],
    '681570519018897446': ['BTC', 'ETH', 'TRX'],
    '673941221638537237': ['BTC', 'XRP', 'LTC'],
    '234054275960012812': ['DOGE', 'ETH', 'XMR'],
    '445348559055749130': ['DOGE', 'ETH', 'BTC'],
    '481157752325013514': ['BTC', 'ETH', 'XRP']
}

query = 'INSERT INTO crypto_pick (userid, pick, pick2, pick3) VALUES '

for userid in users.keys():
    query += "('" + userid + "','" + users[userid][0] + "','" + users[userid][1] + "','" + users[userid][2] + "'),"

query = query[:len(query)-1] #remove trailing comma

print(query)
useless = input()
