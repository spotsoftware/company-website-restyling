var Grid = (function() {

    // list of items
    var $grid = $('#og-grid'),
        // the items
        $items = $grid.children('li'),
        // current expanded item's index
        current = -1,
        // position (top) of the expanded item
        // used to know if the preview will expand in a different row
        previewPos = -1,
        // extra amount of pixels to scroll the window
        scrollExtra = 0,
        // extra margin when expanded (between preview overlay and the next items)
        marginExpanded = 10,
        $window = $(window),
        winsize,
        $body = $('html, body'),
        // transitionend events
        transEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'msTransition': 'MSTransitionEnd',
            'transition': 'transitionend'
        },
        transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
        // support for csstransitions
        support = Modernizr.csstransitions,
        // default settings
        settings = {
            minHeight: 500,
            speed: 350,
            easing: 'ease'
        };

    function init(config) {

        // the settings..
        settings = $.extend(true, {}, settings, config);

        // preload all images
        $grid.imagesLoaded(function() {

            // save item´s size and offset
            saveItemInfo(true);
            // get window´s size
            getWinSize();
            // initialize some events
            initEvents();

        });
    };

    // add more items to the grid.
    // the new items need to appended to the grid.
    // after that call Grid.addItems(theItems);
    function addItems($newitems) {

        $items = $items.add($newitems);

        $newitems.each(function() {
            var $item = $(this);
            $item.data({
                offsetTop: $item.offset().top,
                height: $item.height()
            });
        });

        initItemsEvents($newitems);
    };

    // saves the item´s offset top and height (if saveheight is true)
    function saveItemInfo(saveheight) {
        $items.each(function() {
            var $item = $(this);
            $item.data('offsetTop', $item.offset().top);
            if (saveheight) {
                $item.data('height', $item.height());
            }
        });
    };

    function initEvents() {

        // when clicking an item, show the preview with the item´s info and large image.
        // close the item if already expanded.
        // also close if clicking on the item´s cross
        initItemsEvents($items);

        // on window resize get the window´s size again
        // reset some values..
        $window.on('debouncedresize', function() {

            scrollExtra = 0;
            previewPos = -1;
            // save item´s offset
            saveItemInfo();
            getWinSize();
            var preview = $.data(this, 'preview');
            if (typeof preview != 'undefined') {
                hidePreview();
            }
        });
    };

    function initItemsEvents($items) {
        $items.on('click', 'span.og-close', function() {
            hidePreview();
            return false;
        }).children('a').on('click', function(e) {

            var $item = $(this).parent();
            // check if item already opened
            current === $item.index() ? hidePreview() : showPreview($item);
            return false;

        });
    };

    function getWinSize() {
        winsize = {
            width: $window.width(),
            height: $window.height()
        };
    };

    function showPreview($item) {

        var preview = $.data(this, 'preview'),
            // item´s offset top
            position = $item.data('offsetTop');

        scrollExtra = 0;

        // if a preview exists and previewPos is different (different row) from item´s top then close it
        if (typeof preview != 'undefined') {

            // not in the same row
            if (previewPos !== position) {
                // if position > previewPos then we need to take te current preview´s height in consideration when scrolling the window
                if (position > previewPos) {
                    scrollExtra = preview.height;
                }
                hidePreview();
            }
            // same row
            else {
                preview.update($item);
                return false;
            }

        }

        // update previewPos
        previewPos = position;
        // initialize new preview for the clicked item
        preview = $.data(this, 'preview', new Preview($item));
        // expand preview overlay
        preview.open();
    };

    function hidePreview() {
        current = -1;
        var preview = $.data(this, 'preview');
        preview.close();
        $.removeData(this, 'preview');
    };

    /**
     * Available types of content that preview can manage
     */
    var ContentTypes = {
        "image": 0,
        "video": 1
    };

    /**
     * Model definition for preview contents
     */
    function Content(type, source) {
        this.type = type;
        this.source = source;
    };

    /**
     * Preview model definition
     */
    function PreviewModel() {
        this.contents = new Array();
        this.description = "";
        this.title = "";
        this.url = "";
    };

    PreviewModel.prototype.buildContents = function(images, video) {
        this.contents = new Array();
        
        if (video !== 'undefined') {
            this.contents.push(new Content(ContentTypes.video, video));
        }

        for (var i = 0; i < images.length; i++) {
            this.contents.push(new Content(ContentTypes.image, images[i]));
        }
    };

    PreviewModel.prototype.getImagesCount = function() {
        var count = 0;
        for (var i = 0; i < this.contents.length; i++) {
            if (this.contents[i].type === ContentTypes.image) {
                count++;
            }
        }
        return count;
    };

    /**
     * Preview object definition
     */
    function Preview($item) {
        this.$item = $item;
        this.model = new PreviewModel();
        this.expandedIdx = this.$item.index();
        this.create();
        this.update();
    };

    Preview.prototype = {
        create: function() {
            // create Preview structure:
            this.$title = $('<h3></h3>');
            this.$description = $('<p></p>');
            this.$href = $('<a href="#">Visit website</a>');
            this.$details = $('<div class="og-details"></div>').append(this.$title, this.$description, this.$href);
            this.$loading = $('<div class="og-loading"></div>');
            this.$fullimage = $('<div class="og-fullimg"></div>').append(this.$loading);
            this.$closePreview = $('<span class="og-close"></span>');
            this.$previewInner = $('<div class="og-expander-inner"></div>').append(this.$closePreview, this.$fullimage, this.$details);
            this.$previewEl = $('<div class="og-expander"></div>').append(this.$previewInner);
            // append preview element to the item
            this.$item.append(this.getEl());
            // set the transitions for the preview and the item
            if (support) {
                this.setTransition();
            }
        },
        fillModel: function($itemEl) {
            this.model.description = $itemEl.data('description');
            this.model.url = $itemEl.attr('href');
            this.model.title = $itemEl.data('title');

            var images = $itemEl.data('images').split(',');
            var video = $itemEl.data('video');
            this.model.buildContents(images, video);
        },
        update: function($item) {
            if ($item) {
                this.$item = $item;
            }

            // if already expanded remove class "og-expanded" from current item and add it to new item
            if (current !== -1) {
                var $currentItem = $items.eq(current);
                $currentItem.removeClass('og-expanded');
                this.$item.addClass('og-expanded');
                // position the preview correctly
                this.positionPreview();
            }

            // update current value
            current = this.$item.index();

            this.fillModel(this.$item.children('a'));

            var self = this;

            this.$title.html(self.model.title);
            this.$description.html(self.model.description);
            this.$href.attr('href', self.model.url);

            // remove the current image in the preview
            if (typeof self.$slider != 'undefined') {
                self.$slider.remove();
            }

            // preload large image and add it to the preview
            // for smaller screens we don´t display the large image (the media query will hide the fullimage wrapper)
            if (self.$fullimage.is(':visible')) {
                this.$loading.show();

                var $slider = $('<ul/>').addClass('slides');
                var $slideContainer = null;
                var $slide = null;
                var $content = null;
                var $prev = null;
                var $next = null;
                var $nav = null;
                var $radio = null;

                for (var i = 0; i < self.model.contents.length; i++) {

                    if (self.model.contents[i].type === ContentTypes.image) {
                        $content = $('<img/>').attr('src', self.model.contents[i].source);
                    } else {
                        var $source = $('<source/>').attr('src', self.model.contents[i].source).attr('type', 'video/mp4');
                        $content = $('<video/>').prop('autoplay', true).append($source);
                    }

                    $slide = $('<div/>').addClass('slide').append($content);

                    $prev = $('<label/>').attr('for', 'content-' + (i === 0 ? self.model.contents.length : i)).addClass('prev').html('&#x2039;');
                    $next = $('<label/>').attr('for', 'content-' + (i === (self.model.contents.length - 1) ? 1 : (i + 2))).addClass('next').html('&#x203a;');
                    $nav = $('<div/>').addClass('nav').append($prev, $next);

                    $slideContainer = $('<li/>').addClass('slide-container').append($slide, $nav);

                    $radio = $('<input />').attr('id', 'content-' + (i + 1)).attr('type', 'radio').attr('name', 'radio-btn');
                    if (i === 0) {
                        $radio.prop("checked", true);
                    }

                    $slider.append($radio);
                    $slider.append($slideContainer);
                }

                function onEverythingLoaded() {
                    self.$loading.hide();
                    self.$fullimage.find('.slides').remove();
                    self.$slider = $slider;
                    self.$slider.fadeIn(350);
                    self.$fullimage.append(self.$slider);
                };

                var counter = 0;
                var target = self.model.getImagesCount();

                $slider.find('img').load(function() {
                    counter++;
                    if (counter === target) {
                        onEverythingLoaded();
                    }
                });
            }
        },
        open: function() {

            setTimeout($.proxy(function() {
                // set the height for the preview and the item
                this.setHeights();
                // scroll to position the preview in the right place
                this.positionPreview();
            }, this), 25);

        },
        close: function() {

            var self = this,
                onEndFn = function() {
                    if (support) {
                        $(this).off(transEndEventName);
                    }
                    self.$item.removeClass('og-expanded');
                    self.$previewEl.remove();
                };

            setTimeout($.proxy(function() {

                if (typeof this.$largeImg !== 'undefined') {
                    this.$largeImg.fadeOut('fast');
                }
                this.$previewEl.css('height', 0);
                // the current expanded item (might be different from this.$item)
                var $expandedItem = $items.eq(this.expandedIdx);
                $expandedItem.css('height', $expandedItem.data('height')).on(transEndEventName, onEndFn);

                if (!support) {
                    onEndFn.call();
                }

            }, this), 25);

            return false;

        },
        calcHeight: function() {

            var heightPreview = winsize.height - this.$item.data('height') - marginExpanded,
                itemHeight = winsize.height;

            if (heightPreview < settings.minHeight) {
                heightPreview = settings.minHeight;
                itemHeight = settings.minHeight + this.$item.data('height') + marginExpanded;
            }

            this.height = heightPreview;
            this.itemHeight = itemHeight;

        },
        setHeights: function() {

            var self = this;
            var onEndFn = function() {
                if (support) {
                    self.$item.off(transEndEventName);
                }
                self.$item.addClass('og-expanded');
            };

            this.calcHeight();
            this.$previewEl.css('height', this.height);
            this.$item.css('height', this.itemHeight).on(transEndEventName, onEndFn);

            if (!support) {
                onEndFn.call();
            }

        },
        positionPreview: function() {

            // scroll page
            // case 1 : preview height + item height fits in window´s height
            // case 2 : preview height + item height does not fit in window´s height and preview height is smaller than window´s height
            // case 3 : preview height + item height does not fit in window´s height and preview height is bigger than window´s height
            var position = this.$item.data('offsetTop'),
                previewOffsetT = this.$previewEl.offset().top - scrollExtra,
                scrollVal = this.height + this.$item.data('height') + marginExpanded <= winsize.height ? position : this.height < winsize.height ? previewOffsetT - (winsize.height - this.height) : previewOffsetT;

            $body.animate({
                scrollTop: scrollVal
            }, settings.speed);

        },
        setTransition: function() {
            this.$previewEl.css('transition', 'height ' + settings.speed + 'ms ' + settings.easing);
            this.$item.css('transition', 'height ' + settings.speed + 'ms ' + settings.easing);
        },
        getEl: function() {
            return this.$previewEl;
        }
    };

    return {
        init: init,
        addItems: addItems
    };

})();