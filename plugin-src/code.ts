import { 
  groupAndLock,
  createPathDataGroups, 
  createPathDataGroup,
  getTargetBounds, 
  scaleAndPositionGroup, 
  adjustStrokeWeights 
} from "./helpers";

figma.showUI(__html__, { themeColors: true, width: 350, height: 606 + 64 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "save-storage") {
    await figma.clientStorage.setAsync(msg.key, msg.value);
    return;
  }

  if (msg.type === "load-storage") {
    const value = await figma.clientStorage.getAsync(msg.key);
    figma.ui.postMessage({ type: "storage-loaded", key: msg.key, value });
    return;
  }

  if (msg.type === "create-geo-globe") {
    try {
      const { continentPathData, countryPathData, graticulePathData, outlinePathData } = msg.pathData;
      const groups = [];

      if (graticulePathData.length) {
        groups.push(createPathDataGroup(
          {name: "Graticules", pathData: graticulePathData}, 
          { outline: true, opacity: 0.25 }
        ));
      }

      if (continentPathData.length) {
        groups.push(createPathDataGroups("Continents", [...continentPathData].reverse()));
      }
      
      if (Object.keys(countryPathData).length) {
        const continentGroups = Object.keys(countryPathData)
          .sort((a, b) => b.localeCompare(a))
          .map(key => createPathDataGroups(key, [...countryPathData[key]].reverse()));

        const countriesGroup = groupAndLock(continentGroups, "Countries");
        groups.push(countriesGroup);
      }

      if (outlinePathData) {
        groups.push(createPathDataGroup(
          {name: "Outline", pathData: outlinePathData}, 
          { outline: true }
        ));
      }

      const finalGroup = groupAndLock(groups, "Geo-Globe");

      const targetBounds = getTargetBounds();
      const scale = scaleAndPositionGroup(finalGroup, targetBounds as any);
      adjustStrokeWeights(finalGroup, 0.5, scale);

      figma.currentPage.selection = [finalGroup];
      figma.closePlugin();
    } catch (e) {
      console.log(e);
    }
  }
};