import * as text from "../../../../kit/text.js";

/** Where a weighted double opt in manifest is in its life cycle. */
export type WeightedDoubleOptInManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted double opt in manifest as the double opt in team keeps it. */
export class WeightedDoubleOptInManifest {
  code: string;
  label: string;
  channel: string;
  phone: string;
  revision: number;
  status: WeightedDoubleOptInManifestStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    phone: string,
    revision: number,
    status: WeightedDoubleOptInManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.phone = phone;
    this.revision = revision;
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

  canMoveTo(next: WeightedDoubleOptInManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedDoubleOptInManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted double opt in manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"weighted double opt in manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): WeightedDoubleOptInManifest {
    return new WeightedDoubleOptInManifest(this.code, this.label, this.channel, this.phone, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted double opt in manifest in status proposed. */
export function newWeightedDoubleOptInManifest(code: string, label: string): WeightedDoubleOptInManifest {
  return new WeightedDoubleOptInManifest(code, label, "", "", 0, "proposed");
}
