import os
import subprocess
import shutil
from pathlib import Path
from PIL import Image

FRONTEND_DIR = Path(r"d:\StuSecure\StuSecure_Frontend")
IMAGES_DIR = FRONTEND_DIR / "assets" / "images"
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# ==============================================================================
# 1. Master App Logo (NO background box/squircle, 100% transparent background)
# ==============================================================================
APP_LOGO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Shield Rim Gradient -->
    <linearGradient id="masterRim" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#00E5FF"/>
      <stop offset="28%" stop-color="#2A69FA"/>
      <stop offset="65%" stop-color="#155EEF"/>
      <stop offset="100%" stop-color="#0047BA"/>
    </linearGradient>

    <!-- Shield Left Facet -->
    <linearGradient id="masterLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D2A54"/>
      <stop offset="100%" stop-color="#071830"/>
    </linearGradient>

    <!-- Shield Right Facet -->
    <linearGradient id="masterRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B55A0"/>
      <stop offset="55%" stop-color="#123B70"/>
      <stop offset="100%" stop-color="#0C2547"/>
    </linearGradient>

    <!-- Inner Core & Monogram Gradient -->
    <linearGradient id="masterCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="45%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>

    <linearGradient id="cyanRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>

    <!-- Soft Drop Shadow -->
    <filter id="masterShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#071326" flood-opacity="0.4"/>
    </filter>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- MASTER SHIELD (NO BACKGROUND RECTANGLE) -->
  <g filter="url(#masterShadow)">
    <!-- Outer Shield Beveled Rim -->
    <path d="M 256 42
             C 348 42, 416 62, 432 94
             C 438 186, 428 308, 256 450
             C 84 308, 74 186, 80 94
             C 96 62, 164 42, 256 42 Z"
          fill="none" stroke="url(#masterRim)" stroke-width="18" stroke-linejoin="round"/>

    <!-- Inner Shield Left Facet -->
    <path d="M 256 58
             L 94 102
             C 89 180, 99 292, 256 432
             L 256 58 Z"
          fill="url(#masterLeft)"/>

    <!-- Inner Shield Right Facet -->
    <path d="M 256 58
             L 418 102
             C 423 180, 413 292, 256 432
             L 256 58 Z"
          fill="url(#masterRight)"/>

    <!-- Center Spine Highlight -->
    <line x1="256" y1="58" x2="256" y2="432" stroke="#00E5FF" stroke-width="2.5" opacity="0.6"/>

    <!-- Dynamic S-Shield Circuit Wings (Glow Layer) -->
    <path d="M 194 154
             C 194 125, 226 112, 256 112
             C 294 112, 326 130, 326 162
             C 326 195, 284 210, 252 225
             C 218 240, 188 258, 188 302
             C 188 344, 224 364, 256 364
             C 294 364, 324 346, 330 326"
          fill="none" stroke="url(#cyanRibbon)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"
          filter="url(#softGlow)" opacity="0.35"/>

    <!-- Dynamic Monogram S & Security Shield Core -->
    <path d="M 194 154
             C 194 125, 226 112, 256 112
             C 294 112, 326 130, 326 162
             C 326 195, 284 210, 252 225
             C 218 240, 188 258, 188 302
             C 188 344, 224 364, 256 364
             C 294 364, 324 346, 330 326"
          fill="none" stroke="url(#masterCore)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Center Security Hub (Padlock & Gateway) -->
    <circle cx="256" cy="234" r="32" fill="#0A1E3D" stroke="url(#masterRim)" stroke-width="5"/>
    <circle cx="256" cy="234" r="16" fill="url(#masterCore)"/>
    <circle cx="256" cy="234" r="7" fill="#071326"/>
    <line x1="256" y1="250" x2="256" y2="284" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>

    <!-- Accent Pin Nodes -->
    <circle cx="256" cy="72" r="5" fill="#00E5FF"/>
    <circle cx="120" cy="112" r="4" fill="#00E5FF" opacity="0.8"/>
    <circle cx="392" cy="112" r="4" fill="#00E5FF" opacity="0.8"/>
  </g>
</svg>
"""

# ==============================================================================
# 2. 1:1 Symbol/Icon for DARK THEME (NO background, 100% transparent background)
# ==============================================================================
APP_ICON_DARK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Dark Mode Rim Gradient: Radiant Cyber-Cyan to Electric Blue -->
    <linearGradient id="iconDarkRim" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="30%" stop-color="#2563EB"/>
      <stop offset="70%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#00D2FF"/>
    </linearGradient>

    <linearGradient id="iconDarkLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A5F"/>
      <stop offset="100%" stop-color="#0F243E"/>
    </linearGradient>

    <linearGradient id="iconDarkRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="70%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#173B70"/>
    </linearGradient>

    <linearGradient id="iconDarkCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>

    <filter id="iconDarkGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0284C7" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- 1:1 DARK THEME ICON (NO BACKGROUND) -->
  <g filter="url(#iconDarkGlow)">
    <!-- Outer Shield Rim -->
    <path d="M 256 50
             C 348 50, 416 70, 432 100
             C 438 190, 428 312, 256 454
             C 84 312, 74 190, 80 100
             C 96 70, 164 50, 256 50 Z"
          fill="none" stroke="url(#iconDarkRim)" stroke-width="20" stroke-linejoin="round"/>

    <!-- Left Facet -->
    <path d="M 256 66
             L 96 108
             C 91 184, 101 292, 256 436
             L 256 66 Z"
          fill="url(#iconDarkLeft)"/>

    <!-- Right Facet -->
    <path d="M 256 66
             L 416 108
             C 421 184, 411 292, 256 436
             L 256 66 Z"
          fill="url(#iconDarkRight)"/>

    <!-- Center Line Seam -->
    <line x1="256" y1="66" x2="256" y2="436" stroke="#38BDF8" stroke-width="3" opacity="0.6"/>

    <!-- Monogram 'S' -->
    <path d="M 194 162
             C 194 134, 224 122, 256 122
             C 290 122, 322 138, 322 170
             C 322 200, 282 214, 252 228
             C 218 244, 190 262, 190 306
             C 190 348, 222 368, 256 368
             C 292 368, 320 350, 326 332"
          fill="none" stroke="url(#iconDarkCore)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Center Padlock Hub -->
    <circle cx="256" cy="238" r="32" fill="#0C1F38" stroke="url(#iconDarkRim)" stroke-width="5"/>
    <circle cx="256" cy="238" r="16" fill="url(#iconDarkCore)"/>
    <circle cx="256" cy="238" r="7" fill="#071326"/>
    <line x1="256" y1="254" x2="256" y2="288" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>

    <circle cx="256" cy="80" r="5" fill="#38BDF8"/>
  </g>
</svg>
"""

# ==============================================================================
# 3. 1:1 Symbol/Icon for LIGHT THEME (NO background, 100% transparent background)
# ==============================================================================
APP_ICON_LIGHT_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Light Mode Rim: Navy to Royal Blue -->
    <linearGradient id="iconLightRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071A33"/>
      <stop offset="40%" stop-color="#155EEF"/>
      <stop offset="100%" stop-color="#0040C1"/>
    </linearGradient>

    <!-- Light Mode Left Facet: Confident Navy -->
    <linearGradient id="iconLightLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2244"/>
      <stop offset="100%" stop-color="#071A33"/>
    </linearGradient>

    <!-- Light Mode Right Facet: Vibrant Royal Blue -->
    <linearGradient id="iconLightRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#155EEF"/>
      <stop offset="60%" stop-color="#0F4CD9"/>
      <stop offset="100%" stop-color="#0B39A8"/>
    </linearGradient>

    <!-- Core: Pure White -->
    <linearGradient id="iconLightCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F0F6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>

    <filter id="iconLightShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#071A33" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- 1:1 LIGHT THEME ICON (NO BACKGROUND) -->
  <g filter="url(#iconLightShadow)">
    <!-- Outer Shield Rim -->
    <path d="M 256 50
             C 348 50, 416 70, 432 100
             C 438 190, 428 312, 256 454
             C 84 312, 74 190, 80 100
             C 96 70, 164 50, 256 50 Z"
          fill="none" stroke="url(#iconLightRim)" stroke-width="20" stroke-linejoin="round"/>

    <!-- Left Facet -->
    <path d="M 256 66
             L 96 108
             C 91 184, 101 292, 256 436
             L 256 66 Z"
          fill="url(#iconLightLeft)"/>

    <!-- Right Facet -->
    <path d="M 256 66
             L 416 108
             C 421 184, 411 292, 256 436
             L 256 66 Z"
          fill="url(#iconLightRight)"/>

    <!-- Center Line Seam -->
    <line x1="256" y1="66" x2="256" y2="436" stroke="#FFFFFF" stroke-width="2.5" opacity="0.45"/>

    <!-- Monogram 'S' -->
    <path d="M 194 162
             C 194 134, 224 122, 256 122
             C 290 122, 322 138, 322 170
             C 322 200, 282 214, 252 228
             C 218 244, 190 262, 190 306
             C 190 348, 222 368, 256 368
             C 292 368, 320 350, 326 332"
          fill="none" stroke="url(#iconLightCore)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Center Padlock Hub -->
    <circle cx="256" cy="238" r="32" fill="#071A33" stroke="#FFFFFF" stroke-width="4.5"/>
    <circle cx="256" cy="238" r="15" fill="#FFFFFF"/>
    <circle cx="256" cy="238" r="7" fill="#155EEF"/>
    <line x1="256" y1="254" x2="256" y2="288" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>

    <circle cx="256" cy="80" r="5" fill="#FFFFFF"/>
  </g>
</svg>
"""

# ==============================================================================
# 4. Logo with Name DARK THEME (Horizontal Lockup, NO background, 100% transparent)
# ==============================================================================
APP_LOGO_WITH_NAME_DARK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 240" width="880" height="240">
  <defs>
    <linearGradient id="hDarkRim" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="30%" stop-color="#2563EB"/>
      <stop offset="70%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#00D2FF"/>
    </linearGradient>

    <linearGradient id="hDarkLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A5F"/>
      <stop offset="100%" stop-color="#0F243E"/>
    </linearGradient>

    <linearGradient id="hDarkRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="70%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#173B70"/>
    </linearGradient>

    <linearGradient id="hDarkCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>

    <linearGradient id="textSecureDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#60A5FA"/>
    </linearGradient>

    <filter id="hDarkGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0284C7" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Symbol on Left: Scaled to ~180px height -->
  <g transform="translate(10, 8) scale(0.48)" filter="url(#hDarkGlow)">
    <path d="M 256 40
             C 344 40, 408 60, 424 90
             C 430 178, 420 296, 256 424
             C 92 296, 82 178, 88 90
             C 104 60, 168 40, 256 40 Z"
          fill="none" stroke="url(#hDarkRim)" stroke-width="20" stroke-linejoin="round"/>

    <path d="M 256 56
             L 102 96
             C 97 172, 107 278, 256 406
             L 256 56 Z"
          fill="url(#hDarkLeft)"/>

    <path d="M 256 56
             L 410 96
             C 415 172, 405 278, 256 406
             L 256 56 Z"
          fill="url(#hDarkRight)"/>

    <line x1="256" y1="56" x2="256" y2="406" stroke="#38BDF8" stroke-width="3" opacity="0.6"/>

    <path d="M 194 150
             C 194 124, 222 112, 256 112
             C 290 112, 320 128, 320 158
             C 320 188, 282 202, 252 216
             C 218 232, 192 248, 192 294
             C 192 334, 222 352, 256 352
             C 290 352, 318 336, 324 320"
          fill="none" stroke="url(#hDarkCore)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>

    <circle cx="256" cy="224" r="32" fill="#0C1F38" stroke="url(#hDarkRim)" stroke-width="5"/>
    <circle cx="256" cy="224" r="16" fill="url(#hDarkCore)"/>
    <circle cx="256" cy="224" r="7" fill="#071326"/>
    <line x1="256" y1="240" x2="256" y2="274" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Typography on Right (NO background box) -->
  <g transform="translate(250, 138)">
    <text font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="82" font-weight="800" letter-spacing="-1.5">
      <tspan fill="#F2F4F7">Stu</tspan><tspan fill="url(#textSecureDark)">Secure</tspan>
    </text>
  </g>

  <!-- Pure Transparent Tagline (NO rect background) -->
  <g transform="translate(254, 182)">
    <circle cx="8" cy="0" r="5" fill="#38BDF8"/>
    <text x="24" y="4" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#9AA3B2" letter-spacing="2.8">
      CAMPUS SAFETY
    </text>
  </g>
</svg>
"""

# ==============================================================================
# 5. Logo with Name LIGHT THEME (Horizontal Lockup, NO background, 100% transparent)
# ==============================================================================
APP_LOGO_WITH_NAME_LIGHT_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 240" width="880" height="240">
  <defs>
    <linearGradient id="hLightRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071A33"/>
      <stop offset="40%" stop-color="#155EEF"/>
      <stop offset="100%" stop-color="#0040C1"/>
    </linearGradient>

    <linearGradient id="hLightLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2244"/>
      <stop offset="100%" stop-color="#071A33"/>
    </linearGradient>

    <linearGradient id="hLightRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#155EEF"/>
      <stop offset="60%" stop-color="#0F4CD9"/>
      <stop offset="100%" stop-color="#0B39A8"/>
    </linearGradient>

    <linearGradient id="hLightCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F0F6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>

    <filter id="hLightShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#071A33" flood-opacity="0.14"/>
    </filter>
  </defs>

  <!-- Symbol on Left: Scaled to ~180px height -->
  <g transform="translate(10, 8) scale(0.48)" filter="url(#hLightShadow)">
    <path d="M 256 40
             C 344 40, 408 60, 424 90
             C 430 178, 420 296, 256 424
             C 92 296, 82 178, 88 90
             C 104 60, 168 40, 256 40 Z"
          fill="none" stroke="url(#hLightRim)" stroke-width="20" stroke-linejoin="round"/>

    <path d="M 256 56
             L 102 96
             C 97 172, 107 278, 256 406
             L 256 56 Z"
          fill="url(#hLightLeft)"/>

    <path d="M 256 56
             L 410 96
             C 415 172, 405 278, 256 406
             L 256 56 Z"
          fill="url(#hLightRight)"/>

    <line x1="256" y1="56" x2="256" y2="406" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>

    <path d="M 194 150
             C 194 124, 222 112, 256 112
             C 290 112, 320 128, 320 158
             C 320 188, 282 202, 252 216
             C 218 232, 192 248, 192 294
             C 192 334, 222 352, 256 352
             C 290 352, 318 336, 324 320"
          fill="none" stroke="url(#hLightCore)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>

    <circle cx="256" cy="224" r="32" fill="#071A33" stroke="#FFFFFF" stroke-width="4"/>
    <circle cx="256" cy="224" r="15" fill="#FFFFFF"/>
    <circle cx="256" cy="224" r="7" fill="#155EEF"/>
    <line x1="256" y1="240" x2="256" y2="274" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Typography on Right (NO background box) -->
  <g transform="translate(250, 138)">
    <text font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="82" font-weight="800" letter-spacing="-1.5">
      <tspan fill="#071A33">Stu</tspan><tspan fill="#155EEF">Secure</tspan>
    </text>
  </g>

  <!-- Pure Transparent Tagline (NO rect background) -->
  <g transform="translate(254, 182)">
    <circle cx="8" cy="0" r="5" fill="#155EEF"/>
    <text x="24" y="4" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#4A5568" letter-spacing="2.8">
      CAMPUS SAFETY
    </text>
  </g>
</svg>
"""

LOGOS = [
    ("app-logo", APP_LOGO_SVG, 512, 512),
    ("app-icon-dark", APP_ICON_DARK_SVG, 512, 512),
    ("app-icon-light", APP_ICON_LIGHT_SVG, 512, 512),
    ("app-logo-with-name-dark", APP_LOGO_WITH_NAME_DARK_SVG, 880, 240),
    ("app-logo-with-name-light", APP_LOGO_WITH_NAME_LIGHT_SVG, 880, 240),
]

def render_svg_to_png(svg_path: Path, png_path: Path, width: int, height: int):
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{
    width: {width}px;
    height: {height}px;
    background: transparent !important;
    overflow: hidden;
  }}
  svg {{
    width: {width}px;
    height: {height}px;
    display: block;
    background: transparent !important;
  }}
</style>
</head>
<body>
{svg_path.read_text(encoding='utf-8')}
</body>
</html>"""
    temp_html = svg_path.with_suffix(".html")
    temp_html.write_text(html_content, encoding='utf-8')

    try:
        cmd = [
            EDGE_EXE,
            "--headless=new",
            "--default-background-color=00000000",
            f"--window-size={width},{height}",
            f"--screenshot={png_path}",
            temp_html.as_uri(),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if res.returncode == 0 and png_path.exists():
            print(f"Rendered transparent PNG: {png_path} ({width}x{height})")
        else:
            print(f"Warning: Failed render for {png_path}: {res.stderr}")
    finally:
        if temp_html.exists():
            temp_html.unlink()

def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    for name, svg_content, w, h in LOGOS:
        svg_file = IMAGES_DIR / f"{name}.svg"
        png_file = IMAGES_DIR / f"{name}.png"
        svg_file.write_text(svg_content.strip(), encoding='utf-8')
        print(f"Saved transparent SVG: {svg_file}")
        render_svg_to_png(svg_file, png_file, w, h)

    # Sync icon.png and stusecure-logo.png
    shutil.copy2(IMAGES_DIR / "app-logo.png", IMAGES_DIR / "icon.png")
    shutil.copy2(IMAGES_DIR / "app-logo-with-name-light.png", IMAGES_DIR / "stusecure-logo.png")
    print("Updated icon.png and stusecure-logo.png with transparent assets.")

    # Validate transparency across all files
    for name, _, _, _ in LOGOS:
        im = Image.open(IMAGES_DIR / f"{name}.png")
        alphas = list(im.getchannel("A").getdata())
        zero_pct = round(sum(1 for a in alphas if a == 0) / len(alphas) * 100, 1)
        print(f"Verification: {name}.png is {zero_pct}% transparent background.")

if __name__ == "__main__":
    main()
