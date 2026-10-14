import * as text from "../../../../kit/text.js";
import { PrimaryDomainMapping } from "./primary-domain-mapping.js";

/** How screens and exports show a primary domain mapping. */
export class PrimaryDomainMappingView {
  code: string;
  title: string;
  localeText: string;
  retries: string;
  quantityText: string;
  visible: string;
  regionText: string;
  journeyId: string;
  floorValueText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    localeText: string,
    retries: string,
    quantityText: string,
    visible: string,
    regionText: string,
    journeyId: string,
    floorValueText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.localeText = localeText;
    this.retries = retries;
    this.quantityText = quantityText;
    this.visible = visible;
    this.regionText = regionText;
    this.journeyId = journeyId;
    this.floorValueText = floorValueText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryDomainMappingView(item: PrimaryDomainMapping): PrimaryDomainMappingView {
  return new PrimaryDomainMappingView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    item.locale,
    String(item.retries),
    String(item.quantity),
    `${item.visible}`,
    item.region,
    item.journeyId,
    item.floorValue.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryDomainMappingViews(items: PrimaryDomainMapping[]): PrimaryDomainMappingView[] {
  const views: PrimaryDomainMappingView[] = [];
  for (const item of items) {
    views.push(toPrimaryDomainMappingView(item));
  }
  return views;
}

export function sumPrimaryDomainMappingView(view: PrimaryDomainMappingView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedRetries + parsedQuantity + parsedFloorValue;
}
