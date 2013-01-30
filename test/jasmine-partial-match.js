	beforeEach(function () {
		this.addMatchers({
			toPartiallyMatch: function (expected) {
				return this.env.equals_(_.pick(this.actual, _.keys(expected)), expected);
			}
		});
  });
  describe ("toPartiallyMatch", function(){
	  it('should compare objects partially using the partiallyMatches matcher', function () {
		expect({ x: 1, y: 2, z: 3 }).toPartiallyMatch({ x: 1, y: 2 });
		expect({ x: 1, y: 2 }).not.toPartiallyMatch({ x: 1, y: 2, t: 3 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 1, y: 2, t: 3 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 2, y: 2 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 1, y: 3 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 1, t: 2 });
    });
  });

