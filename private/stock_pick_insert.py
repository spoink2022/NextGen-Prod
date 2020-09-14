users = {
    '322180183207575553': ['GTX', 'BRK.B'],
    '165924625929207808': ['TSM', 'NMI'],
    '496776875520032802': ['PENN', 'NKLA'],
    '694664740177313833': ['GOOG', 'TECL'],
    '489039802553860097': ['DAL', 'TSY'],
    '393981842878889995': ['BRK.B', 'HZNP'],
    '623645548704169985': ['NNOX', 'FBIO'],
    '589555071348375554': ['ROKU', 'AMD'],
    '489259107841212416': ['AAPL', 'NVDA'],
    '234054275960012812': ['ACLS', 'GTX']
}

query = 'INSERT INTO stock_pick (userid, pick, pick2) VALUES '

for userid in users.keys():
    query += "('" + userid + "','" + users[userid][0] + "','" + users[userid][1] + "'),"

query = query[:len(query)-1] #remove trailing comma

print(query)
useless = input()
