export async function fetch_dom(path) {
  var response = await fetch(`http://${window.location.hostname}:${window.location.port}/` + path);
  var body;
  await response.text().then((t) => body = t);
  return new DOMParser().parseFromString(body, "text/html").documentElement.querySelector("body");
}
