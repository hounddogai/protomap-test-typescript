import * as text from "../../../../kit/text.js";

/** Where a weighted invite manifest is in its life cycle. */
export type WeightedInviteManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted invite manifest as the invite team keeps it. */
export class WeightedInviteManifest {
  code: string;
  name: string;
  ratio: number;
  locale: string;
  title: string;
  status: WeightedInviteManifestStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    locale: string,
    title: string,
    status: WeightedInviteManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.locale = locale;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedInviteManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedInviteManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted invite manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): WeightedInviteManifest {
    return new WeightedInviteManifest(this.code, this.name, this.ratio, this.locale, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted invite manifest in status new. */
export function newWeightedInviteManifest(code: string, name: string): WeightedInviteManifest {
  return new WeightedInviteManifest(code, name, 0, "", "", "new");
}
