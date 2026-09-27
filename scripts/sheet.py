import sys
from PIL import Image, ImageDraw
# usage: sheet.py out.png cols img1 img2 ...
out=sys.argv[1]; cols=int(sys.argv[2]); files=sys.argv[3:]
w,h=640,360
rows=(len(files)+cols-1)//cols
S=Image.new('RGB',(w*cols,h*rows),'white')
d=ImageDraw.Draw(S)
for i,f in enumerate(files):
    im=Image.open(f).convert('RGB').resize((w,h))
    S.paste(im,((i%cols)*w,(i//cols)*h))
    d.text(((i%cols)*w+6,(i//cols)*h+4),f.split('/')[-1],fill=(200,40,40))
S.save(out)
