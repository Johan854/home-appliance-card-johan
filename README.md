# Home Appliance Card (FR)

Carte Home Assistant pour l'électroménager : **lave-linge, sèche-linge, lave-vaisselle, four encastré, micro-ondes, réfrigérateur 1 porte, congélateur 1 porte**. Illustration animée pendant le cycle, état, puissance, infos du dernier cycle, température, alerte « plus de consommation » et photo de l'appareil en option. Style verre, thème clair/sombre automatique, éditeur visuel, textes en français.

## Installation (HACS)
1. HACS → ⋮ → *Dépôts personnalisés* → `https://github.com/Johan854/home-appliance-card-johan`, catégorie **Tableau de bord**.
2. Installer, puis recharger le navigateur.

## Exemple
```yaml
type: custom:home-appliance-card
title: Électroménager
appliances:
  - type: washer            # washer | dryer | dishwasher | oven | microwave | fridge | freezer
    name: Lave-linge
    state_entity: sensor.etat_lave_linge      # états « marche » / « arret » reconnus d'office
    power_entity: sensor.puissance_lavelinge
    image: /local/lave-linge.png              # facultatif
    image_mode: background                    # background | replace
    image_opacity: 0.35
    info_entities:
      - { entity: input_number.cout_dernier_cycle_lave_linge, label: Coût dernier cycle }
  - type: freezer
    name: Congélateur
    state_entity: sensor.etat_congelateur
    power_entity: sensor.puissance_congelateur
    temperature_entity: sensor.congelateur_temperature
    no_power_after: 120      # alerte si aucune consommation depuis 120 min
  - type: oven
    name: Four
    power_entity: sensor.puissance_four
    temperature_entity: sensor.temperature_four   # facultatif
```
Options par appareil : `power_threshold` (W, seuil de marche), `temp_alert` (°C), `on_states` (états « en marche », séparés par des virgules).
