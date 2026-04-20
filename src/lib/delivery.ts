type DeliveryInput = {
  channel: "EMAIL" | "PHONE";
  destination: string;
  code: string;
};

export async function deliverSignInCode(input: DeliveryInput) {
  const providerLabel =
    input.channel === "EMAIL"
      ? process.env.SMTP_HOST
        ? `SMTP:${process.env.SMTP_HOST}`
        : "console-fallback"
      : process.env.SMS_PROVIDER_NAME
        ? `SMS:${process.env.SMS_PROVIDER_NAME}`
        : "console-fallback";

  console.info(
    `[auth-code][${providerLabel}] ${input.channel} -> ${input.destination} :: ${input.code}`
  );
}
