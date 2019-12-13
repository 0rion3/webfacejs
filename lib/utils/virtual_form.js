export const submitVirtualForm = (url, fields, { method = "POST" }) => {
  const form = document.createElement("form");
  form.action = url;
  form.method = method;

  for (let key in fields) {
    const input = document.createElement("input");
    input.name = key;
    input.type = "hidden";
    input.setAttribute("value", fields[key]);
    form.append(input);
  }

  if(!["POST", "GET"].includes(method)) {
    const method_input = document.createElement("input")
    method_input.name = "_method";
    method_input.type = "hidden";
    method_input.setAttribute("value", method);
    form.append(method_input);
    form.method = "POST";
  }

  const auth_token_input = document.createElement("input");
  auth_token_input.name = "authenticity_token";
  auth_token_input.type = "hidden";
  auth_token_input.setAttribute("value", document.body.getAttribute("data-authenticity-token"));
  form.append(auth_token_input);

  form.style.display = "none";
  document.body.append(form);

  form.submit();
};
