import * as text from "../../../../kit/text.js";

/** Where a primary step window is in its life cycle. */
export type PrimaryStepWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary step window. Its code is unique within a tenant. */
export class PrimaryStepWindow {
  code: string;
  name: string;
  weight: number;
  country: string;
  ratio: number;
  createdAt: number;
  revision: number;
  unit: string;
  discount: number;
  status: PrimaryStepWindowStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    country: string,
    ratio: number,
    createdAt: number,
    revision: number,
    unit: string,
    discount: number,
    status: PrimaryStepWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.country = country;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.revision = revision;
    this.unit = unit;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryStepWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryStepWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary step window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"primary step window"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.revision + this.ratio) * 100) / 100;
  }

  copy(): PrimaryStepWindow {
    return new PrimaryStepWindow(
      this.code,
      this.name,
      this.weight,
      this.country,
      this.ratio,
      this.createdAt,
      this.revision,
      this.unit,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary step window in status idle. */
export function newPrimaryStepWindow(code: string, name: string): PrimaryStepWindow {
  return new PrimaryStepWindow(code, name, 0, "", 0, 0, 0, "", 0, "idle");
}
