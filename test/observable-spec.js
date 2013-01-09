describe ("Observable", function(){
  var obs,listener;
  beforeEach(function(){
    obs=observable({});
    listener=jasmine.createSpy('Listener');
  });
  it("allows subscribers to observe an event", function(){
    obs.addEventListener('TestEvt',listener);
    obs.dispatchEvent('TestEvt','some','args');
    expect(listener).toHaveBeenCalledWith('some','args');
  });
  it("allows multiple subscribers to observe the same event", function(){
    obs.addEventListener('TestEvt',function(){});
    obs.addEventListener('TestEvt',listener);
    obs.dispatchEvent('TestEvt','some','args');
    expect(listener).toHaveBeenCalledWith('some','args');
  });
  it("allows same subscriber to observe multiple events", function(){
    obs.addEventListener('TestEvt',listener);
    obs.addEventListener('TestEvt2',listener);
    obs.dispatchEvent('TestEvt','some','args');
    obs.dispatchEvent('TestEvt2','more','params');
    expect(listener).toHaveBeenCalledWith('some','args');
    expect(listener).toHaveBeenCalledWith('more','params');
  });
  it("stops propagation if an event listener returns false", function(){
    obs.addEventListener('TestEvt',function(){return false;});
    obs.addEventListener('TestEvt',listener);
    obs.dispatchEvent('TestEvt','some','args');
    expect(listener).not.toHaveBeenCalledWith();
  });
  it("does not dispatch events to unsubscribed listeners", function(){
    obs.addEventListener('TestEvt',listener);
    obs.removeEventListener('TestEvt',listener);
    obs.dispatchEvent('TestEvt','some','args');
    expect(listener).not.toHaveBeenCalledWith();
  });
  it("does not dispatch events to subscribers of unrelated events", function(){
    obs.addEventListener('TestEvt',listener);
    obs.dispatchEvent('UnrelatedEvt','some','args');
    expect(listener).not.toHaveBeenCalled();
  });
  it('dispatches all events with arguments to the event sink', function(){
    obs.addEventSink(listener);
    obs.dispatchEvent('TestEvt','some','args');
    obs.dispatchEvent('UnrelatedEvt','other','params','and','nothing');
    expect(listener).toHaveBeenCalledWith('TestEvt','some','args');
    expect(listener).toHaveBeenCalledWith('UnrelatedEvt','other','params','and','nothing');
  });
});
