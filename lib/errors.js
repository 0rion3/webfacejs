export class MethodImplementationMissingError extends Error {
  constructor(method_name, class_name) {
    super(`Missing implementation of method ${method_name}() in class ${class_name}`);
  }
}
