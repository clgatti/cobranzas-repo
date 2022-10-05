<<<<<<< HEAD
/**
 * Canvas Extra
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true,CanvasRenderingContext2D:true,isMobile:true,click2:true,mousemove:true, */

(function () {
	CanvasRenderingContext2D.prototype.__defineGetter__("width", function () {
		return this.canvas.width;
	});
	CanvasRenderingContext2D.prototype.__defineGetter__("height", function () {
		return this.canvas.height;
	});

	// Black and White
	CanvasRenderingContext2D.prototype.blackAndWhite = function () {
		var frame = this.getImageData(0, 0, this.width, this.height);
		for (var i = 0; i < frame.data.length; i += 4) {
			var r = frame.data[i + 0];
			var g = frame.data[i + 1];
			var b = frame.data[i + 2];
			var v = r + g + b;
			v /= 3;
			frame.data[i + 0] = v;
			frame.data[i + 1] = v;
			frame.data[i + 2] = v;
		}
		this.putImageData(frame, 0, 0);
	};

	// Flip
	CanvasRenderingContext2D.prototype.flipVertically = function () {
		this.save();
		this.scale(1, -1);
		this.translate(0, -this.height);
		this.drawImage(this.canvas, 0, 0);
		this.restore();
	};
	CanvasRenderingContext2D.prototype.flipHorizontally = function () {
		this.save();
		this.scale(-1, 1);
		this.translate(-this.width, 0);
		this.drawImage(this.canvas, 0, 0);
		this.restore();
	};

	// Turn
	CanvasRenderingContext2D.prototype.turn = function (clockwise) {
		var tmpCanvas = document.createElement("canvas");
		tmpCanvas.width = this.width;
		tmpCanvas.height = this.height;
		tmpCanvas.style.display = "none";
		document.body.appendChild(tmpCanvas);
		tmpCanvas.getContext("2d").drawImage(this.canvas, 0, 0);

		this.canvas.width = tmpCanvas.height;
		this.canvas.height = tmpCanvas.width;

		this.save();
		if (clockwise) {
			this.translate(this.width, 0);
		} else {
			this.translate(0, this.height);
		}
		var rad = Math.PI / 2;
		if (!clockwise) {
			rad *= -1;
		}
		this.rotate(rad);
		this.drawImage(tmpCanvas, 0, 0);
		this.restore();
		document.body.removeChild(tmpCanvas);
	};

	// Resize
	CanvasRenderingContext2D.prototype.resize = function (ratio) {
		var tmpCanvas = document.createElement("canvas");
		tmpCanvas.width = this.width;
		tmpCanvas.height = this.height;
		tmpCanvas.style.display = "none";
		document.body.appendChild(tmpCanvas);
		tmpCanvas.getContext("2d").drawImage(this.canvas, 0, 0);

		this.canvas.width *= ratio;
		this.canvas.height *= ratio;

		this.save();
		this.scale(ratio, ratio);
		this.drawImage(tmpCanvas, 0, 0);
		document.body.removeChild(tmpCanvas);
		this.restore();
	};

	// Orientation
	CanvasRenderingContext2D.prototype.isPortrait = function () {
		return this.width < this.height;
	};

	// Drag'n'Drop
	CanvasRenderingContext2D.prototype._urlDropped = function (url, x, y, drawBorder) {
		var self = this;
		var img = document.createElement("img");
		img.style.display = "none";
		img.addEventListener("load", function () {

			var ratio;
			var ratioX = 1;
			var ratioY = 1;
			if (img.width > self.width / 3) {
				ratioX = (self.width / 3) / img.width;
			}
			if (img.height > self.height / 3) {
				ratioY = (self.height / 3) / img.height;
			}
			ratio = Math.min(ratioX, ratioY);

			self.save();
			self.translate(x - img.width * ratio / 2, y - img.height * ratio / 2);
			self.scale(ratio, ratio);
			self.drawImage(img, 0, 0);
			if (drawBorder) {
				self.strokeStyle = "white";
				self.lineWidth = 5 / ratio;
				self.strokeRect(0, 0, img.width, img.height);
			}
			self.restore();
			document.body.removeChild(img);
		}, true);
		img.src = url;
		document.body.appendChild(img);
	};

	CanvasRenderingContext2D.prototype.initDnD = function () {
		var self = this;

		this.canvas.addEventListener("dragover", function (e) {
			e.preventDefault();
		}, true);
		this.canvas.addEventListener("drop", function (e) {
			e.preventDefault();

			var dt = e.dataTransfer;

			var posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			var posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

			var x = posx - self.canvas.offsetLeft - self.canvas.parentNode.offsetLeft;
			var y = posy - self.canvas.offsetTop - self.canvas.parentNode.offsetTop;

			var files = dt.files;
			if (files.length === 0) {
				var type = "application/x-moz-file-promise-url";
				if (dt.types.contains(type)) {
					self._urlDropped(dt.getData(type), x, y, false);
				}
			} else {
				var file = files[0];
				var reader = new FileReader();
				reader.onload = function (e) {
					self._urlDropped(e.target.result, x, y, true);
				};
				reader.readAsDataURL(file);
			}
		}, true);
	};

	// Poster
	CanvasRenderingContext2D.prototype.poster = function (text) {
		var size = Math.min(this.width, this.height);
		size /= 10;

		/*
		 * this.save(); this.translate(size, size); this.scale((this.width - 2 *
		 * size) / this.width, (this.width - 2 * size) / this.width);
		 * this.drawImage(this.canvas, 0, 0); this.strokeRect(0, 0,
		 * this.canvas.width, this.canvas.height); this.restore();
		 */

		this.fillStyle = "black";
		this.fillRect(0, 0, this.width, size);
		this.fillRect(0, this.height - 2 * size, this.width, 2 * size);
		this.fillRect(0, 0, size, this.height);
		this.fillRect(this.width - size, 0, size, this.height);
		this.strokeStyle = "white";
		var border = 5;
		this.strokeRect(size - border, size - border, this.width - (size * 2) + 2 * border, this.height - (size * 3) + 2 * border);
		this.fillStyle = "white";
		this.textAlign = "center";
		this.textBaseline = "middle";
		this.font = size + "px marketing";
		this.fillText(text, this.width / 2, this.height - size, this.width);
	};

	// Crop
	CanvasRenderingContext2D.prototype.initCrop = function () {
		if (isMobile) {
			this.initCrop_mobile();
		} else {
			this.initCrop_desktop();
		}
	};
	CanvasRenderingContext2D.prototype.initCrop_mobile = function () {
		var orgX, orgY;

		var self = this;
		var buffer = this.canvas;

		function click1(e) {
			orgX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			orgY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			buffer.removeEventListener("click", click1, true);
			buffer.addEventListener("click", click2, true);
		}

		function click2(e) {
			buffer.removeEventListener("click", click2, true);

			var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			var width = x - orgX;
			var height = y - orgY;

			x = orgX;
			y = orgY;

			if (width < 0) {
				x += width;
				width *= -1;
			}

			if (height < 0) {
				y += height;
				height *= -1;
			}

			x -= buffer.offsetLeft + buffer.parentNode.offsetLeft;
			y -= buffer.offsetTop + buffer.parentNode.offsetTop;

			self.crop(x, y, width, height);
		}

		buffer.addEventListener("click", click1, true);
	};

	CanvasRenderingContext2D.prototype.initCrop_desktop = function () {
		var cropbox = document.createElement("div");
		cropbox.id = "cropbox";
		cropbox.style.display = "none";
		document.body.appendChild(cropbox);
		var orgX, orgY;

		var self = this;
		var buffer = this.canvas;

		function mousedown(e) {
			orgX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			orgY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			buffer.addEventListener("mousemove", mousemove, true);
		}

		function mouseup(e) {
			buffer.removeEventListener("mousemove", mousemove, true);
			buffer.removeEventListener("mousedown", mousedown, true);
			buffer.removeEventListener("mouseup", mouseup, true);
			var x = cropbox.offsetLeft - buffer.offsetLeft - buffer.parentNode.offsetLeft;
			var y = cropbox.offsetTop - buffer.offsetTop - buffer.parentNode.offsetTop;
			var width = cropbox.offsetWidth;
			var height = cropbox.offsetHeight;

			document.body.removeChild(cropbox);
			self.crop(x, y, width, height);
		}
		function mousemove(e) {
			var posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			var posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

			var x = orgX;
			var y = orgY;
			var width = posx - orgX;
			var height = posy - orgY;

			if (width < 0) {
				x += width;
				width *= -1;
			}

			if (height < 0) {
				y += height;
				height *= -1;
			}

			cropbox.style.display = "block";
			cropbox.style.left = x + "px";
			cropbox.style.top = y + "px";
			cropbox.style.width = width + "px";
			cropbox.style.height = height + "px";
		}

		buffer.addEventListener("mousedown", mousedown, true);
		buffer.addEventListener("mouseup", mouseup, true);
	};

	CanvasRenderingContext2D.prototype.crop = function (x, y, width, height) {
		var tmpCanvas = document.createElement("canvas");
		tmpCanvas.width = this.width;
		tmpCanvas.height = this.height;
		tmpCanvas.style.display = "none";
		document.body.appendChild(tmpCanvas);
		tmpCanvas.getContext("2d").drawImage(this.canvas, 0, 0);

		this.canvas.width = width;
		this.canvas.height = height;

		this.save();
		this.drawImage(tmpCanvas, -x, -y);
		this.restore();
		document.body.removeChild(tmpCanvas);
	};
}());
=======
/*! Fabrik */

CanvasRenderingContext2D.prototype.__defineGetter__("width",function(){return this.canvas.width}),CanvasRenderingContext2D.prototype.__defineGetter__("height",function(){return this.canvas.height}),CanvasRenderingContext2D.prototype.blackAndWhite=function(){for(var t=this.getImageData(0,0,this.width,this.height),e=0;e<t.data.length;e+=4){var n=t.data[e+0]+t.data[e+1]+t.data[e+2];n/=3,t.data[e+0]=n,t.data[e+1]=n,t.data[e+2]=n}this.putImageData(t,0,0)},CanvasRenderingContext2D.prototype.flipVertically=function(){this.save(),this.scale(1,-1),this.translate(0,-this.height),this.drawImage(this.canvas,0,0),this.restore()},CanvasRenderingContext2D.prototype.flipHorizontally=function(){this.save(),this.scale(-1,1),this.translate(-this.width,0),this.drawImage(this.canvas,0,0),this.restore()},CanvasRenderingContext2D.prototype.turn=function(t){var e=document.createElement("canvas");e.width=this.width,e.height=this.height,e.style.display="none",document.body.appendChild(e),e.getContext("2d").drawImage(this.canvas,0,0),this.canvas.width=e.height,this.canvas.height=e.width,this.save(),t?this.translate(this.width,0):this.translate(0,this.height);var n=Math.PI/2;t||(n*=-1),this.rotate(n),this.drawImage(e,0,0),this.restore(),document.body.removeChild(e)},CanvasRenderingContext2D.prototype.resize=function(t){var e=document.createElement("canvas");e.width=this.width,e.height=this.height,e.style.display="none",document.body.appendChild(e),e.getContext("2d").drawImage(this.canvas,0,0),this.canvas.width*=t,this.canvas.height*=t,this.save(),this.scale(t,t),this.drawImage(e,0,0),document.body.removeChild(e),this.restore()},CanvasRenderingContext2D.prototype.isPortrait=function(){return this.width<this.height},CanvasRenderingContext2D.prototype._urlDropped=function(t,i,o,s){var a=this,h=document.createElement("img");h.style.display="none",h.addEventListener("load",function(){var t,e=1,n=1;h.width>a.width/3&&(e=a.width/3/h.width),h.height>a.height/3&&(n=a.height/3/h.height),t=Math.min(e,n),a.save(),a.translate(i-h.width*t/2,o-h.height*t/2),a.scale(t,t),a.drawImage(h,0,0),s&&(a.strokeStyle="white",a.lineWidth=5/t,a.strokeRect(0,0,h.width,h.height)),a.restore(),document.body.removeChild(h)},!0),h.src=t,document.body.appendChild(h)},CanvasRenderingContext2D.prototype.initDnD=function(){var c=this;this.canvas.addEventListener("dragover",function(t){t.preventDefault()},!0),this.canvas.addEventListener("drop",function(t){t.preventDefault();var e=t.dataTransfer,n=t.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,i=t.clientY+document.body.scrollTop+document.documentElement.scrollTop,o=n-c.canvas.offsetLeft-c.canvas.parentNode.offsetLeft,s=i-c.canvas.offsetTop-c.canvas.parentNode.offsetTop,a=e.files;if(0===a.length){var h="application/x-moz-file-promise-url";e.types.contains(h)&&c._urlDropped(e.getData(h),o,s,!1)}else{var d=a[0],r=new FileReader;r.onload=function(t){c._urlDropped(t.target.result,o,s,!0)},r.readAsDataURL(d)}},!0)},CanvasRenderingContext2D.prototype.poster=function(t){var e=Math.min(this.width,this.height);e/=10,this.fillStyle="black",this.fillRect(0,0,this.width,e),this.fillRect(0,this.height-2*e,this.width,2*e),this.fillRect(0,0,e,this.height),this.fillRect(this.width-e,0,e,this.height),this.strokeStyle="white",this.strokeRect(e-5,e-5,this.width-2*e+10,this.height-3*e+10),this.fillStyle="white",this.textAlign="center",this.textBaseline="middle",this.font=e+"px marketing",this.fillText(t,this.width/2,this.height-e,this.width)},CanvasRenderingContext2D.prototype.initCrop=function(){isMobile?this.initCrop_mobile():this.initCrop_desktop()},CanvasRenderingContext2D.prototype.initCrop_mobile=function(){var s,a,h=this,d=this.canvas;function r(t){d.removeEventListener("click",r,!0);var e=t.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,n=t.clientY+document.body.scrollTop+document.documentElement.scrollTop,i=e-s,o=n-a;e=s,n=a,i<0&&(e+=i,i*=-1),o<0&&(n+=o,o*=-1),e-=d.offsetLeft+d.parentNode.offsetLeft,n-=d.offsetTop+d.parentNode.offsetTop,h.crop(e,n,i,o)}d.addEventListener("click",function t(e){s=e.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,a=e.clientY+document.body.scrollTop+document.documentElement.scrollTop,d.removeEventListener("click",t,!0),d.addEventListener("click",r,!0)},!0)},CanvasRenderingContext2D.prototype.initCrop_desktop=function(){var h,d,r=document.createElement("div");r.id="cropbox",r.style.display="none",document.body.appendChild(r);var a=this,c=this.canvas;function l(t){h=t.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,d=t.clientY+document.body.scrollTop+document.documentElement.scrollTop,c.addEventListener("mousemove",p,!0)}function p(t){var e=t.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,n=t.clientY+document.body.scrollTop+document.documentElement.scrollTop,i=h,o=d,s=e-h,a=n-d;s<0&&(i+=s,s*=-1),a<0&&(o+=a,a*=-1),r.style.display="block",r.style.left=i+"px",r.style.top=o+"px",r.style.width=s+"px",r.style.height=a+"px"}c.addEventListener("mousedown",l,!0),c.addEventListener("mouseup",function t(e){c.removeEventListener("mousemove",p,!0),c.removeEventListener("mousedown",l,!0),c.removeEventListener("mouseup",t,!0);var n=r.offsetLeft-c.offsetLeft-c.parentNode.offsetLeft,i=r.offsetTop-c.offsetTop-c.parentNode.offsetTop,o=r.offsetWidth,s=r.offsetHeight;document.body.removeChild(r),a.crop(n,i,o,s)},!0)},CanvasRenderingContext2D.prototype.crop=function(t,e,n,i){var o=document.createElement("canvas");o.width=this.width,o.height=this.height,o.style.display="none",document.body.appendChild(o),o.getContext("2d").drawImage(this.canvas,0,0),this.canvas.width=n,this.canvas.height=i,this.save(),this.drawImage(o,-t,-e),this.restore(),document.body.removeChild(o)};
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
