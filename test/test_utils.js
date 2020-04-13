export async function fetch_dom(path, params = {}) {
  const url = new URL(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/${path}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  var response = await fetch(url);
  var body;
  await response.text().then((t) => body = t);
  return new DOMParser().parseFromString(body, "text/html").documentElement.querySelector("body");
}
