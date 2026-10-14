import * as text from "../../../../kit/text.js";

/** Where a path reservation is in its life cycle. */
export type PathReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a path reservation and its current status. */
export class PathReservation {
  code: string;
  label: string;
  locale: string;
  unit: string;
  budget: number;
  country: string;
  tags: string[];
  segment: string;
  description: string;
  status: PathReservationStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    unit: string,
    budget: number,
    country: string,
    tags: string[],
    segment: string,
    description: string,
    status: PathReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.unit = unit;
    this.budget = budget;
    this.country = country;
    this.tags = tags;
    this.segment = segment;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PathReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PathReservation {
    return new PathReservation(
      this.code,
      this.label,
      this.locale,
      this.unit,
      this.budget,
      this.country,
      this.tags,
      this.segment,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a path reservation in status requested. */
export function newPathReservation(code: string, label: string): PathReservation {
  return new PathReservation(code, label, "", "", 0, "", [], "", "", "requested");
}
