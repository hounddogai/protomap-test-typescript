import { TouchpointMapping } from "./touchpoint-mapping.js";

/** How screens and exports show a touchpoint mapping. */
export class TouchpointMappingView {
  code: string;
  labelText: string;
  minimumText: string;
  clicks: string;
  countryText: string;
  visible: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    minimumText: string,
    clicks: string,
    countryText: string,
    visible: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.minimumText = minimumText;
    this.clicks = clicks;
    this.countryText = countryText;
    this.visible = visible;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointMappingView(item: TouchpointMapping): TouchpointMappingView {
  return new TouchpointMappingView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    String(item.clicks),
    item.country,
    `${item.visible}`,
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointMappingViews(items: TouchpointMapping[]): TouchpointMappingView[] {
  const views: TouchpointMappingView[] = [];
  for (const item of items) {
    views.push(toTouchpointMappingView(item));
  }
  return views;
}

export function sumTouchpointMappingView(view: TouchpointMappingView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedMinimum + parsedClicks;
}
