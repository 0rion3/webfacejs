export default class PublicPromise {

  constructor() {
    var self = this;
    this.promise = new Promise((resolve, reject) => {
      self.resolve = resolve;
      self.reject  = reject;
    });
    return this;
  }

  then    = f => this.promise.then(f);
  catch   = f => this.promise.catch(f);
  finally = f => this.promise.finally(f);

}
