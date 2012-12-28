window.onload = function () {
    var randomMap = function (level, options) {
        var rnd = function (l, r) {
            return l + Math.floor((r - l) * Math.random());
        }, result = {
            label: options.labels[rnd(0, options.labels.length)]
        }, i;
        if (level < options.maxLevel) {
            result.c = [];
            result.c.length = rnd(options.minChildren, options.maxChildren + 1);
            for (i = 0; i <  result.c.length; i++) {
                result.c[i] = randomMap(level + 1, options);
            }
        }
        return result;
    };
    var margin = 12;
    var calcWH = function (map) {
        var i,
            W = 0,
            H = 0;
        var l = new Kinetic.Idea({ text: map.label });
        map.W = map.w = l.getWidth() + 2 * margin;
        map.H = map.h = l.getHeight() + 2 * margin;
        if (map.c) {
            for (i = 0; i < map.c.length; i++) {
                calcWH(map.c[i]);
                W = Math.max(W, map.c[i].W);
                H += map.c[i].H;
            }
            map.W += W;
            map.H = Math.max(map.H, H);
        }
    };
    var stage = new Kinetic.Stage({
        container: 'container',
        width: 1000,
        height: 1000
    });
    var layer = new Kinetic.Layer();
    var draw = function (map, x0, y0) {
        var labelx = x0,
            labely = y0 + 0.5 * (map.H - map.h),
            i, cy = y0,
            currentDroppable;
        map.text = new Kinetic.Idea({
            x: labelx + margin,
            y: labely + margin,
            text: map.label
        });
        layer.add(map.text);
        if (map.c) {
            for (i = 0; i < map.c.length; i++) {
                draw(map.c[i], x0 + map.w, cy);
                map.c[i].connector = new Kinetic.Connector({
                    shapeFrom: map.text,
                    shapeTo: map.c[i].text,
                    stroke: '#888',
                    strokeWidth: 2,
                });
                layer.add(map.c[i].connector);
                cy += map.c[i].H;
            }
        }
        map.text.on('dragmove', function () {
            map.text.moveToTop();
            var droppable = stage.getIntersection({x: map.text.attrs.x, y: map.text.attrs.y });
            if (droppable && droppable.shape && droppable.shape !== currentDroppable) {
                currentDroppable = droppable.shape;
                currentDroppable.transitionTo({
                    opacity: 0.5,
                    duration: 0.2
                });
            } else if (!droppable && currentDroppable) {
                currentDroppable.transitionTo({
                    opacity: 1,
                    duration: 0.2
                });
                currentDroppable = undefined;
            }
        });
        map.text.on('dragend', function () {
            if (currentDroppable) {
                currentDroppable.transitionTo({
                    opacity: 1,
                    duration: 0.2
                });
                alert('do something');
            } else {
                map.text.transitionTo({
                    x: labelx + margin,
                    y: labely + margin,
                    easing: 'bounce-ease-out',
                    duration: 0.4
                });
            }
        });
    };
    document.getElementById('btn').onclick = function () {
        var map = randomMap(
            1, {
                maxLevel: 4,
                minChildren: 2,
                maxChildren: 4,
                labels: [
                    'Hello',
                    'World',
                    'JavaScript' ,
                    'TDD',
                    'Gvojko',
                    'Danijel',
                    'Two line\ntitle',
                    'Longer title',
                    'Impact',
                    'Mapping',
                    'Jokes',
                    'Bug tracking',
                    'Measurements'
                ]
            }
        );
        calcWH(map);
        layer.remove();
        draw(map, 0, 0);
        stage.add(layer);
    };
};
