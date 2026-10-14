import { ConversionException } from "./conversion-exception.js";

/** How screens and exports show a conversion exception. */
export class ConversionExceptionView {
  code: string;
  name: string;
  revision: string;
  segment: string;
  ceiling: string;
  minimum: string;
  titleText: string;
  contactEmail: string;
  graceDays: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    segment: string,
    ceiling: string,
    minimum: string,
    titleText: string,
    contactEmail: string,
    graceDays: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.segment = segment;
    this.ceiling = ceiling;
    this.minimum = minimum;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toConversionExceptionView(item: ConversionException): ConversionExceptionView {
  return new ConversionExceptionView(
    item.code,
    item.name,
    String(item.revision),
    item.segment,
    item.ceiling.toFixed(2),
    item.minimum.toFixed(2),
    item.title,
    item.contactEmail,
    String(item.graceDays),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionExceptionViews(items: ConversionException[]): ConversionExceptionView[] {
  const views: ConversionExceptionView[] = [];
  for (const item of items) {
    views.push(toConversionExceptionView(item));
  }
  return views;
}

export function sumConversionExceptionView(view: ConversionExceptionView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRevision + parsedCeiling + parsedMinimum;
}
