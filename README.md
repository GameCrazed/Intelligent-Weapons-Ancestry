# Intelligent Weapon Ancestry (PF2e, Foundry VTT)

Foundry VTT module that adds the **Intelligent Weapon** ancestry from *Battlezoo Ancestries: Classic Creatures* to the Pathfinder 2e system. You need to own the book; this module contains condensed paraphrases of the rules, not the book text.

## Contents

| Pack | Contents |
|------|----------|
| IW Ancestries | Intelligent Weapon ancestry (HP 8, Speed 25, Con + free boost, low-light vision, rare) |
| IW Heritages | Animated, Possessing, Projecting, Symbiotic Weapon |
| IW Ancestry Features | Living Construct, Inanimate Mode, Weapon (granted by the ancestry) |
| IW Feats | 37 ancestry feats, levels 1-17 |
| IW Actions | Project Avatar |

It also registers the `intelligent-weapon` creature/feat traits and the `activation` feat trait via PF2e homebrew flags.

## Install

Use the manifest URL in `module.json`, or copy this folder to `Data/modules/intelligent-weapons-ancestry-pf2e`.

To install a local build into Foundry, close Foundry and run `powershell -File tools\install.ps1`. It replaces the installed module folder; copying over an existing install leaves stale LevelDB files that override the new pack data.

## Notes

- Versatile heritages: take one in place of a weapon heritage and apply the ancestry description's rules manually.
- Choices such as weapon type, weapon magical tradition, wielder ancestry, and symbiotic skills are handled manually.
- Automation is intentionally light (darkvision, Animated Weapon's Tiny size).

## Rebuilding packs

Pack data is defined in `tools/build-packs.mjs` and compiled to LevelDB:

```
npm install
npm run build
```
