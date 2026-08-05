export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname.endsWith(".")) {
    url.hostname = url.hostname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    let canonicalHost = "";

    if (url.hostname.endsWith(".hamuzon-jp.f5.si")) {
      canonicalHost = url.hostname;
    } else if (url.hostname.endsWith(".hamusata.f5.si")) {
      canonicalHost = url.hostname;
    }

    if (canonicalHost) {
      const canonicalUrl = `https://${canonicalHost}${url.pathname}`;
      return new HTMLRewriter()
        .on("head", {
          element(element) {
            element.append(
              `<link rel="canonical" href="${canonicalUrl}" />`,
              { html: true }
            );
          },
        })
        .transform(response);
    }
  }

  return response;
}
