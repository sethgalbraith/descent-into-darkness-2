import pygame
import sys
import os.path

# load magenta team color palette

magenta = []

for line in open("wesnoth-tc.gpl.txt"):
  words = line.split()
  if len(words) >= 3 and words[0][0] in "0123456789":
    r, g, b = [int(word) for word in words[:3]]
    rgb = 65536 * r + 256 * g + b
    magenta.append(rgb)

# create alternate team color palette

r = int(sys.argv[1])
g = int(sys.argv[2])
b = int(sys.argv[3])

code = 65536 * r + 256 * g + b

palette = []

for i in range(1, 11):
  c = pygame.Color(r * i / 10, g * i / 10, b * i / 10, 255)
  palette.append(c)

for i in range(9, 0, -1):
  w = 255 * (10 - i) / 10
  c = pygame.Color(w + r * i / 10, w + g * i / 10, w + b * i / 10, 255)
  palette.append(c)

# load image

for path2file in sys.argv[4:]:
  path, filename = os.path.split(path2file)
  if (filename[-4:].lower() != ".png"): continue
  image = pygame.image.load(path2file)
  for y in range(image.get_height()):
    for x in range(image.get_width()):
      r, g, b, a = tuple(image.get_at((x, y)));
      if a == 255:
        rgb = 65536 * r + 256 * g + b
        for i in range(len(magenta)):
          if rgb == magenta[i]:
            image.set_at((x, y), palette[i])
            break
  pygame.image.save(image, filename[:-4] + "-%06x.png" % code)

