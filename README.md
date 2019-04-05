# Homework 6: City Generation

Project by Nicholas Keenan. Pennkey: nkeenan.
Demo Link: https://nkeenan38.github.io/hw06-city-generation/

## Terrain and Population Generation
Terrain and population were generated on both the CPU and GPU using fractal brownian motion. Terrain height below a threshold is treated as water, and the population for these regions is set to 0. The threshold for sea level can be controlled. 

Terrain and population density each have 3 viewing options. 'Detailed' shows a smooth terrain map and population map, with the population at each pixel precisely described by their corresponding color. The next option, 'Simple' shows only land and water regions for the terrain, with no extra information about terrain height. 'Simple' for population density separates the population map into discrete values in increments of 0.1. I find this view makes the population map more easily readable. Finally, both have a 'None' option that displays no color data.

## Highways and Roads
Highways follow no controlled pattern. They connect the most dense population centers. Roads follow a grid pattern, with East-West blocks being longer than North-South. Roads branch into population areas above a certain threshold. This threshold can also be adjusted.

## Buildings
Buildings have 3 basic types: High, Medium, and Low. The building type depends on the population density at its location. High buildings are located in dense population areas and resemble skyscrapers. Medium buildings are a tier below in population density, and tend to be shorter, mult-story buildings. Finally, Low buildings appear in the lowest population density regions, and are much shorter and simpler in comparison to the other building types.
