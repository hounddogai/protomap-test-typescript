import * as text from "../../../../kit/text.js";

/** Where a touchpoint manifest is in its life cycle. */
export type TouchpointManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a touchpoint manifest and its current status. */
export class TouchpointManifest {
  code: string;
  name: string;
  endsAt: number;
  maximum: number;
  summary: string;
  weight: number;
  status: TouchpointManifestStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    maximum: number,
    summary: string,
    weight: number,
    status: TouchpointManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.summary = summary;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round(this.endsAt * this.weight * 100) / 100;
  }

  copy(): TouchpointManifest {
    return new TouchpointManifest(
      this.code,
      this.name,
      this.endsAt,
      this.maximum,
      this.summary,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a touchpoint manifest in status planned. */
export function newTouchpointManifest(code: string, name: string): TouchpointManifest {
  return new TouchpointManifest(code, name, 0, 0, "", 0, "planned");
}
