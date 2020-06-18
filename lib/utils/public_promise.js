export default class PublicPromise {

  static async sequence(functions) {
    var top_promise = new PublicPromise();
    var promise     = new Promise(resolve => resolve());
    if(functions.length == 0)
      return promise;
    for(let i in functions) {
      if(functions[i]) {
        await promise.then(() => {
          promise = functions[i]();
          if(i == functions.length-1)
            promise.then(() => top_promise.resolve());
        });
      }
    }
    return top_promise;
  }

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
    });
    return this;
  }

  then(f)    { return this.promise.then(f);    }
  catch(f)   { return this.promise.catch(f);   }
  finally(f) { return this.promise.finally(f); }

  get resolved() { return this.status == "resolved" }
  get rejected() { return this.status == "rejected" }

}
