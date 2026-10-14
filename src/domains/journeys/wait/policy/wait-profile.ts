import * as text from "../../../../kit/text.js";

/** Where a wait profile is in its life cycle. */
export type WaitProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A wait profile. Its code is unique within a tenant. */
export class WaitProfile {
  code: string;
  name: string;
  margin: number;
  weight: number;
  clicks: number;
  threshold: number;
  title: string;
  status: WaitProfileStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    weight: number,
    clicks: number,
    threshold: number,
    title: string,
    status: WaitProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.weight = weight;
    this.clicks = clicks;
    this.threshold = threshold;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round(this.clicks * this.margin * 100) / 100;
  }

  copy(): WaitProfile {
    return new WaitProfile(
      this.code,
      this.name,
      this.margin,
      this.weight,
      this.clicks,
      this.threshold,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait profile in status proposed. */
export function newWaitProfile(code: string, name: string): WaitProfile {
  return new WaitProfile(code, name, 0, 0, 0, 0, "", "proposed");
}
