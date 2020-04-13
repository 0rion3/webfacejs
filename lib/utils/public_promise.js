export default class PublicPromise {

  constructor() {
    var self = this;
    this.promise = new Promise((resolve, reject) => {
      self.resolve = resolve;
      self.reject  = reject;
    });
    this.promise.then((v) => {
      self.status = "resolved";
      self.result = v;
    }).catch((v) => {
      self.status = "rejected";
      self.result = v;
    })
    return this;
  }

  then    = f => this.promise.then(f)
  catch   = f => this.promise.catch(f)
  finally = f => this.promise.finally(f)

  get resolved() { return this.status == "resolved" }
  get rejected() { return this.status == "rejected" }

}
