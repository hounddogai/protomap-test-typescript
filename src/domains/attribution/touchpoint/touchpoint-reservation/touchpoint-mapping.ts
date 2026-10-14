import * as text from "../../../../kit/text.js";

/** Where a touchpoint mapping is in its life cycle. */
export type TouchpointMappingStatus = "created" | "validated" | "published" | "retired";

/** A touchpoint mapping as the touchpoint team keeps it. */
export class TouchpointMapping {
  code: string;
  label: string;
  minimum: number;
  clicks: number;
  country: string;
  visible: boolean;
  name: string;
  status: TouchpointMappingStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    clicks: number,
    country: string,
    visible: boolean,
    name: string,
    status: TouchpointMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.clicks = clicks;
    this.country = country;
    this.visible = visible;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TouchpointMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint mapping"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.clicks + this.minimum) * 100) / 100;
  }

  copy(): TouchpointMapping {
    return new TouchpointMapping(
      this.code,
      this.label,
      this.minimum,
      this.clicks,
      this.country,
      this.visible,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a touchpoint mapping in status created. */
export function newTouchpointMapping(code: string, label: string): TouchpointMapping {
  return new TouchpointMapping(code, label, 0, 0, "", false, "", "created");
}
