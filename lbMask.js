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
            onImageCreate: function (img) { },
            onMaskImageCreate: function (div) { }
        }, options);


        var container = {};


        let prevX = 0,
            prevY = 0,
            draggable = false,
            img,
            canvas,
            context,
            image,
            initImage = false,
            startX = settings.x,
            startY = settings.y,
            div,
            obj = $(this);

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
            prevX = pos.x;
            prevY = pos.y;
            return $(item);
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


        container.getImagePosition = function () {
            return { x: settings.x, y: settings.y, scale: settings.scale };
        };

        container.onDragOver = function (evt) {
            if (draggable && $(canvas).attr("active") === "true") {
                var pos = container.mousePosition(evt);
                var x = settings.x + pos.x - prevX;
                var y = settings.y + pos.y - prevY;
                if (x === settings.x && y === settings.y)
                    return; // position has not changed
                settings.x = x;
                settings.y = y;
                prevX = pos.x;
                prevY = pos.y;
                container.updateStyle();
            }
        };

        container.updateStyle = function () {

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.globalCompositeOperation = "source-over";

            if (initImage || !image) {
                image = new Image();
                image.setAttribute('crossOrigin', 'anonymous');
                image.src = settings.maskImageUrl;
                image.onload = function () {
                    if (settings.onImageCreate)
                        settings.onImageCreate(image);

                    canvas.width = image.width * settings.scale;
                    canvas.height = image.height * settings.scale;
                    context.drawImage(image, 0, 0, image.width, image.height);
                    div.css({ "width": image.width, "height": image.height });
                };
            } else {
                context.drawImage(image, 0, 0, image.width, image.height);
            }

            if (initImage || !img) {
                img = new Image();
                img.src = settings.imageUrl || "";
                img.setAttribute('crossOrigin', 'anonymous');
                img.onload = function () {
                    settings.x = settings.x === 0 && initImage === true ? (canvas.width - (img.width * settings.scale)) / 2 : settings.x;
                    settings.y = settings.y === 0 && initImage === true ? (canvas.height - (img.height * settings.scale)) / 2 : settings.y;
                    context.globalCompositeOperation = 'source-atop';
                    context.drawImage(img, settings.x, settings.y, img.width * settings.scale, img.height * settings.scale);
                    initImage = false;
                };
            } else {
                context.globalCompositeOperation = 'source-atop';
                context.drawImage(img, settings.x, settings.y, img.width * settings.scale, img.height * settings.scale);
            }
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

        container.createCanvas = function () {
            if (canvas)
                canvas.remove();
            canvas = document.createElement("canvas");
            context = canvas.getContext('2d');
            canvas.setAttribute("draggable", "true");
            canvas.setAttribute("id", settings.id);
            div.append(canvas);
            div.find("canvas").hover(container.selected);
            div.find("canvas").on('touchstart mousedown', container.selected);
            div.find("canvas").on('touchend mouseup', function (event) {
                if (event.handled === true) return;
                event.handled = true;
                JQmasks.forEach(function (item) {
                    item.item.disable();
                });
            });
            div.find("canvas").bind("dragover", container.onDragOver);
        };


        // change the masked Image
        container.loadMaskImage = function (imageUrl, from) {
            if (div)
                div.remove();


            settings.maskImageUrl = imageUrl;
            div = $("<div/>", {
                "class": "masked-img"
            });
            container.createCanvas();
            obj.append(div);
            if (settings.onMaskImageCreate)
                settings.onMaskImageCreate(div);
            container.loadImage(settings.imageUrl);
        };
        container.loadMaskImage(settings.maskImageUrl);
        JQmasks.push({ item: container, id: settings.id });

        return container;
    };
}(jQuery));