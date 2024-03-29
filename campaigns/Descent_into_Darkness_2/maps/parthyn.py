paths = [[(1530,197), (1314,215), (1071,161), (918,71), (900,116), (756,116), (612,224)]]

def relative(points):
  path = [points[0]]
  x, y = points[0]
  for point in points[1:]:
    x += point[0]
    y += point[1]
    path.append((x, y))
  paths.append(path)

relative(((1206,1259), (108,0), (45,-27), (0,-225), (-162,-36), (-162,90), (-216,36), (-252,144), (243,207), (117,-81), (0,-72)))
relative(((567,1241), (0,-144), (126,-108)))
relative(((1359,1007), (63,-36), (45,36), (108,-72), (54,27)))
relative(((1629,1178), (-108,-135), (0,-72), (54,-36), (54,27), (108,-63), (108,-153)))
relative(((1629,962), (108,-63), (54,-45), (54,36), (63,126), (81,54), (72,-72)))
relative(((2061,998), (117,117), (0,216), (-117,72), (-108,-81)))
relative(((1530,197), (180,-72), (90,0)))
relative(((1845,746), (-63,-18), (0,-153), (-63,-135), (-135,-207), (-54,-36)))
relative(((612,224), (-486,0)))

for path in paths:
 print "<path>"
 for point in path:
   print "  <p x=\"%i\" y=\"%i\"/>" % point
 print "</path>"

