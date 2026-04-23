---
name: Valix
colors:
  surface: '#0a141e'
  surface-dim: '#0a141e'
  surface-bright: '#303a45'
  surface-container-lowest: '#050f19'
  surface-container-low: '#121c27'
  surface-container: '#17202b'
  surface-container-high: '#212b35'
  surface-container-highest: '#2c3641'
  on-surface: '#d9e3f2'
  on-surface-variant: '#e4bdbc'
  inverse-surface: '#d9e3f2'
  inverse-on-surface: '#27313c'
  outline: '#ab8887'
  outline-variant: '#5b403f'
  surface-tint: '#ffb3b2'
  primary: '#ffb3b2'
  on-primary: '#680013'
  primary-container: '#ff525d'
  on-primary-container: '#5b000f'
  inverse-primary: '#bd0c2d'
  secondary: '#cac6bf'
  on-secondary: '#31302c'
  secondary-container: '#484742'
  on-secondary-container: '#b8b5ae'
  tertiary: '#02e600'
  on-tertiary: '#013a00'
  tertiary-container: '#03a800'
  on-tertiary-container: '#013200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b2'
  on-primary-fixed: '#410008'
  on-primary-fixed-variant: '#92001f'
  secondary-fixed: '#e6e2db'
  secondary-fixed-dim: '#cac6bf'
  on-secondary-fixed: '#1c1c18'
  on-secondary-fixed-variant: '#484742'
  tertiary-fixed: '#77ff61'
  tertiary-fixed-dim: '#02e600'
  on-tertiary-fixed: '#002200'
  on-tertiary-fixed-variant: '#015300'
  background: '#0a141e'
  on-background: '#d9e3f2'
  surface-variant: '#2c3641'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  code-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 16px
  margin: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-stakes competitive environments, channeling an elite, tactical aesthetic that prioritizes speed of recognition and aggressive precision. It targets a demographic of digital natives who value performance and a "zero-latency" visual feel.

The style is a fusion of **High-Contrast Bold** and **Brutalism**. It rejects soft curves in favor of 45-degree mitered corners, diagonal structural elements, and a high-density information display. The visual language is intentionally disruptive, using subtle scanline overlays and flickering micro-animations to simulate a high-tech combat terminal.

## Colors

The palette is anchored by the tension between the deep, utilitarian **Deep Charcoal** and the aggressive **Valorant Red**. 

- **Primary (#FF4655):** Used for critical actions, branding, and highlighting aggressive intent.
- **Secondary (#ECE8E1):** A high-readability off-white used for primary text and structural outlines against dark backgrounds.
- **Neutral (#0F1923):** The foundation color for all surfaces, providing a low-light environment that makes primary accents pop.
- **Success State (#00FF00):** A vibrant, digital green reserved for tactical confirmations and positive feedback loops.

Color application should be sparse but impactful, ensuring that the interface remains functional under high-stress conditions.

## Typography

The typography system is split between tactical headers and utilitarian body text. **Space Grotesk** is the primary choice for headlines, utilized in all-caps with tight tracking to mimic the condensed, aggressive feel of military-grade typography. 

**Inter** serves as the functional workhorse for all body content, offering maximum legibility at small scales. Labels should always be rendered in bold, uppercase **Space Grotesk** with increased letter spacing to create a sense of technical metadata.

## Layout & Spacing

This design system utilizes a **12-column fluid grid** with a strict 4px baseline. Layouts are characterized by asymmetrical containers and large, "hazardous" margins. 

Containers should frequently utilize diagonal "clipped" corners (45-degree cuts). Gutters are kept tight to emphasize the density of a tactical HUD. Components should be grouped in "modules" that feel like they are part of a unified tactical operating system.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** rather than shadows. In this system, elevation is "stacked" using varying shades of charcoal and sharp-edged outlines.

- **Level 0 (Base):** Deep Charcoal (#0F1923).
- **Level 1 (Panels):** Surfaces slightly lighter than the base with 1px Off-White (#ECE8E1) borders at 10% opacity.
- **Level 2 (Active Elements):** Elements use a high-opacity border and subtle scanline textures (diagonal 1px lines at 5% opacity).
- **Glitch Depth:** Error states utilize a horizontal chromatic aberration effect, creating a "flickering" depth that suggests hardware malfunction.

## Shapes

The shape language is strictly **Sharp (0px)**. Roundness is prohibited to maintain the aggressive, futuristic aesthetic. To add visual interest, use "tactical cuts"—removing a 8px or 16px corner at a 45-degree angle—on primary containers and buttons. This creates a silhouette that feels machined and intentional.

## Components

### Player Cards
Cards feature a high-contrast background with a diagonal 45-degree split. The top section contains character portraits with a saturation-heavy color grade, while the bottom section displays stats using the `label-bold` typography. A "Status" indicator glows in either the Primary Red or Success Green.

### Tactical Terminal Search
The search bar is styled as a command-line terminal. It features a constant blinking underscore cursor and a fixed "USER_SEARCH:/" prefix. Text input appears in a monospaced-style weight of Inter.

### Pulsing Countdown Timer
A circular stroke timer with a thickness of 4px. The circle is segmented into quarters. The core of the timer pulses with a subtle Valorant Red glow (#FF4655) using a CSS scale animation that triggers every second.

### Buttons
Buttons are rectangular with mitered corners. The "Primary" button is solid Valorant Red with Off-White text. The "Ghost" button uses a 1px Off-White border. On hover, buttons should have a slight "glitch" shift—displacing the text by 2px horizontally for a split second.

### States
- **Success:** Use a hard 2px green (#00FF00) border and static "particle" blocks—small 2x2px squares—clustered at the corners.
- **Error:** Trigger a red glitch effect where the component flashes between #FF4655 and a darker red, accompanied by a slight horizontal jitter.