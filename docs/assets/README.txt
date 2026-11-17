Website assets (pre-final; swap by regenerating with the same file names).
SRC = ~/Desktop/WristMetronome-AppStore-3.0
ICON = WristMetronome/Assets.xcassets/AppIcon.appiconset/AppIcon.png (1024 px, in the app repo)
Tools: sips (macOS), cwebp and ffmpeg (Homebrew).

icon-512.png          ICON                          sips -Z 512 ICON --out icon-512.png
apple-touch-icon.png  ICON                          sips -Z 180 ICON --out apple-touch-icon.png
favicon-64.png        ICON                          sips -Z 64  ICON --out favicon-64.png
app-store-badge.svg   Apple "Download on the App Store" black US-English badge, unaltered, downloaded from
                      https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83

Screenshots (raw captures, no frames): cwebp -q 80 -m 6 -resize <W> 0 <src> -o <name>.webp
shot-watch-1..5.webp  SRC/AppleWatch-S12-46mm/raw/01-wrist, 02-signature, 03-black, 04-wristdown, 05-settings   W=400
shot-iphone-1..5.webp SRC/iPhone-6.3-DynamicIsland/raw/01-dial, 02-signature, 03-mirror, 04-profiles, 05-lockscreen  W=700
                      (05-lockscreen is a composite Lock Screen; replace with a real capture when available)
shot-ipad-1..4.webp   SRC/iPad-13/raw/01-dial, 02-signature, 03-mirror, 04-profiles   W=1200  (shot-ipad-4 currently unused)
shot-stand-1.webp     SRC/iPad-13/raw/05-stage.png (iPad Stage View)                  W=1000
shot-stand-2.webp     SRC/stand-mode-review/duo-front-stand-playing.png (Duo front-screen Stand View)  W=1200
shot-duo-1.webp       SRC/iPhone-Duo-inner/raw/01-dial.png                             W=1400

Video and stills:
promo.mp4         SRC/promo/promo-1920x1080.mp4
                  ffmpeg -i <src> -an -vf "scale=1280:720:flags=lanczos,format=yuv420p" -c:v libx264 -profile:v high
                         -preset slow -crf 22 -maxrate 4M -bufsize 8M -movflags +faststart promo.mp4
promo-poster.jpg  SRC/promo/promo-1920x1080-poster.png   ffmpeg -i <src> -vf scale=1280:720:flags=lanczos -q:v 4 promo-poster.jpg
og-image.jpg      SRC/promo/promo-1920x1080-poster.png   ffmpeg -i <src> -vf "scale=1200:-2:flags=lanczos,crop=1200:630" -q:v 4 og-image.jpg
