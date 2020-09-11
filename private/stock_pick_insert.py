users = {
    '322180183207575553': ['AAPL', 'AMZN'],
    '480960685464092672': ['TSLA', 'MSFT'],
    '530592555436474369': ['MARK', 'AMD']
}

query = 'INSERT INTO stock_pick (userid, pick, pick2) VALUES '

for userid in users.keys():
    query += "('" + userid + "','" + users[userid][0] + "','" + users[userid][1] + "'),"

query = query[:len(query)-1] #remove trailing comma

print(query)
useless = input()
