// jq plugin for mask
(function ($) {
    var JQmasks = [];
    $.fn.mask = function (options) {
        // This is the easiest way to have default options.
        var settings = $.extend({
            // These are the defaults.
            maskImageUrl: undefined,
            imageUrl: undefined,
            scale: 1,
            id: new Date().getUTCMilliseconds().toString() + JQmasks.length,
            x: 0, // image start position
            y: 0, // image start position
            onMaskImageCreate: function (div) { },
        }, options);


        var container = $(this);

        let prevX = 0,
            prevY = 0,
            draggable = false,
            img,
            canvas,
            context,
            image,
            timeout,
            initImage = false,
            startX = settings.x,
            startY = settings.y,
            div;

        container.mousePosition = function (event) {
            return { x: event.pageX || event.offsetX, y: event.pageY || event.offsetY };
        };

        container.selected = function (ev) {
            var pos = container.mousePosition(ev);
            var item = $(".masked-img canvas").filter(function () {
                var offset = $(this).offset();
                var x = pos.x - offset.left;
                var y = pos.y - offset.top;
                var d = this.getContext('2d').getImageData(x, y, 1, 1).data;
                return d[0] > 0;
            });

            JQmasks.forEach(function (el) {
                var id = item.length > 0 ? $(item).attr("id") : "";
                if (el.id === id)
                    el.item.enable();
                else el.item.disable();
            });
        };

        container.enable = function () {
            draggable = true;
            $(canvas).attr("active", "true");
            div.css({ "z-index": 2 });
        };

        container.disable = function () {
            draggable = false;
            $(canvas).attr("active", "false");
            div.css({ "z-index": 1 });
        };

        container.onDragStart = function (evt) {
            container.selected(evt);
            if (draggable) {
                prevX = evt.clientX;
                prevY = evt.clientY;
            }
        };

        container.getImagePosition = function () {
            return { x: settings.x, y: settings.y, scale: settings.scale };
        };

        container.onDragOver = function (evt) {
            if (draggable && $(canvas).attr("active") === "true") {
                var x = settings.x + evt.clientX - prevX;
                var y = settings.y + evt.clientY - prevY;
                if (x === settings.x && y === settings.y)
                    return; // position has not changed
                settings.x += evt.clientX - prevX;
                settings.y += evt.clientY - prevY;
                prevX = evt.clientX;
                prevY = evt.clientY;
                container.updateStyle();
            }
        };

        container.updateStyle = function () {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.globalCompositeOperation = "source-over";
                image = new Image();
                image.setAttribute('crossOrigin', 'anonymous');
                image.src = settings.maskImageUrl;
                image.onload = function () {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    context.drawImage(image, 0, 0, image.width, image.height);
                    div.css({ "width": image.width, "height": image.height });
                };

                img = new Image();
                img.src = settings.imageUrl;
                img.setAttribute('crossOrigin', 'anonymous');
                img.onload = function () {
                    settings.x = settings.x === 0 && initImage ? (canvas.width - (img.width * settings.scale)) / 2 : settings.x;
                    settings.y = settings.y === 0 && initImage ? (canvas.height - (img.height * settings.scale)) / 2 : settings.y;
                    context.globalCompositeOperation = 'source-atop';
                    context.drawImage(img, settings.x, settings.y, img.width * settings.scale, img.height * settings.scale);
                    initImage = false;
                };
            }, 0);
        };

        // change the draggable image
        container.loadImage = function (imageUrl) {
            if (img)
                img.remove();
            // reset the code.
            settings.y = startY;
            settings.x = startX;
            prevX = prevY = 0;
            settings.imageUrl = imageUrl;
            initImage = true;
            container.updateStyle();
        };

        // change the masked Image
        container.loadMaskImage = function (imageUrl, from) {
            if (div)
                div.remove();
            canvas = document.createElement("canvas");
            context = canvas.getContext('2d');
            canvas.setAttribute("draggable", "true");
            canvas.setAttribute("id", settings.id);
            settings.maskImageUrl = imageUrl;
            div = $("<div/>", {
                "class": "masked-img"
            }).append(canvas);

            div.find("canvas").on('touchstart mousedown', function (event) {
                if (event.handled === true) return;
                event.handled = true;
                container.onDragStart(event);
            });

            div.find("canvas").on('touchend mouseup', function (event) {
                if (event.handled === true) return;
                event.handled = true;
                container.selected(event);
            });

            div.find("canvas").bind("dragover", container.onDragOver);
            container.append(div);
            if (settings.onMaskImageCreate)
                settings.onMaskImageCreate(div);
            container.loadImage(settings.imageUrl);
        };
        container.loadMaskImage(settings.maskImageUrl);
        JQmasks.push({ item: container, id: settings.id });

        return container;
    };
}(jQuery));