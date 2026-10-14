import * as text from "../../../../kit/text.js";

/** Where a pending sla forecast is in its life cycle. */
export type PendingSlaForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a pending sla forecast and its current status. */
export class PendingSlaForecast {
  code: string;
  name: string;
  visible: boolean;
  title: string;
  maximum: number;
  country: string;
  minimum: number;
  weight: number;
  revision: number;
  active: boolean;
  status: PendingSlaForecastStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    title: string,
    maximum: number,
    country: string,
    minimum: number,
    weight: number,
    revision: number,
    active: boolean,
    status: PendingSlaForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.title = title;
    this.maximum = maximum;
    this.country = country;
    this.minimum = minimum;
    this.weight = weight;
    this.revision = revision;
    this.active = active;
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

  canMoveTo(next: PendingSlaForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingSlaForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sla forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"pending sla forecast"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.revision + this.weight) * 100) / 100;
  }

  copy(): PendingSlaForecast {
    return new PendingSlaForecast(
      this.code,
      this.name,
      this.visible,
      this.title,
      this.maximum,
      this.country,
      this.minimum,
      this.weight,
      this.revision,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending sla forecast in status requested. */
export function newPendingSlaForecast(code: string, name: string): PendingSlaForecast {
  return new PendingSlaForecast(code, name, false, "", 0, "", 0, 0, 0, false, "requested");
}
