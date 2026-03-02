#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCREEN_DIR="$ROOT_DIR/assets/img/screens"
VIDEO_DIR="$ROOT_DIR/assets/video"
mkdir -p "$VIDEO_DIR"

# 4s hero video: high-pressure conversion beat montage
ffmpeg -y \
  -loop 1 -t 1.20 -i "$SCREEN_DIR/shot1.jpg" \
  -loop 1 -t 1.20 -i "$SCREEN_DIR/shot3.jpg" \
  -loop 1 -t 1.20 -i "$SCREEN_DIR/shot4.jpg" \
  -loop 1 -t 1.20 -i "$SCREEN_DIR/shot5.jpg" \
  -filter_complex "
    [0:v]scale=1080:1920,zoompan=z='min(zoom+0.0008,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=36:s=1080x1920:fps=30[v0];
    [1:v]scale=1080:1920,zoompan=z='min(zoom+0.0007,1.09)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=36:s=1080x1920:fps=30[v1];
    [2:v]scale=1080:1920,zoompan=z='min(zoom+0.0007,1.09)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=36:s=1080x1920:fps=30[v2];
    [3:v]scale=1080:1920,zoompan=z='min(zoom+0.0008,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=36:s=1080x1920:fps=30[v3];
    [v0][v1]xfade=transition=slideleft:duration=0.18:offset=1.02[a01];
    [a01][v2]xfade=transition=fade:duration=0.18:offset=2.04[a02];
    [a02][v3]xfade=transition=slideright:duration=0.18:offset=3.06,format=yuv420p[base];
    [base]drawbox=x=0:y=0:w=iw:h=220:color=black@0.16:t=fill,
          drawbox=x=0:y=ih-280:w=iw:h=280:color=black@0.22:t=fill[vout]
  " \
  -map "[vout]" \
  -r 30 -t 4.0 -c:v libx264 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  "$VIDEO_DIR/hero-main-4s.mp4"

# 8s benefit video: follow-up persuasion beat montage
ffmpeg -y \
  -loop 1 -t 1.80 -i "$SCREEN_DIR/shot5.jpg" \
  -loop 1 -t 1.80 -i "$SCREEN_DIR/shot1.jpg" \
  -loop 1 -t 1.80 -i "$SCREEN_DIR/shot2.jpg" \
  -loop 1 -t 1.80 -i "$SCREEN_DIR/shot4.jpg" \
  -loop 1 -t 1.80 -i "$SCREEN_DIR/shot3.jpg" \
  -filter_complex "
    [0:v]scale=1080:1920,zoompan=z='min(zoom+0.00055,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=54:s=1080x1920:fps=30[b0];
    [1:v]scale=1080:1920,zoompan=z='min(zoom+0.00055,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=54:s=1080x1920:fps=30[b1];
    [2:v]scale=1080:1920,zoompan=z='min(zoom+0.00055,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=54:s=1080x1920:fps=30[b2];
    [3:v]scale=1080:1920,zoompan=z='min(zoom+0.00055,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=54:s=1080x1920:fps=30[b3];
    [4:v]scale=1080:1920,zoompan=z='min(zoom+0.00055,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=54:s=1080x1920:fps=30[b4];
    [b0][b1]xfade=transition=smoothleft:duration=0.25:offset=1.55[c01];
    [c01][b2]xfade=transition=fade:duration=0.25:offset=3.10[c02];
    [c02][b3]xfade=transition=smoothright:duration=0.25:offset=4.65[c03];
    [c03][b4]xfade=transition=fadeblack:duration=0.25:offset=6.20,format=yuv420p[base2];
    [base2]drawbox=x=0:y=0:w=iw:h=220:color=black@0.18:t=fill,
          drawbox=x=0:y=ih-280:w=iw:h=280:color=black@0.2:t=fill[vout2]
  " \
  -map "[vout2]" \
  -r 30 -t 8.0 -c:v libx264 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  "$VIDEO_DIR/benefit-8s.mp4"

# Poster extraction
ffmpeg -y -i "$VIDEO_DIR/hero-main-4s.mp4" -update 1 -frames:v 1 -q:v 2 "$VIDEO_DIR/hero-poster.jpg"
ffmpeg -y -i "$VIDEO_DIR/benefit-8s.mp4" -update 1 -frames:v 1 -q:v 2 "$VIDEO_DIR/benefit-poster.jpg"

printf '\nGenerated videos:\n'
ls -lh "$VIDEO_DIR"/hero-main-4s.mp4 "$VIDEO_DIR"/benefit-8s.mp4 "$VIDEO_DIR"/hero-poster.jpg "$VIDEO_DIR"/benefit-poster.jpg
