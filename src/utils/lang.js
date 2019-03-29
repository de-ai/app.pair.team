
export const Arrays = {
// 	containsElement  : (arr, element)=> (arr.indexOf(element) > -1),
	containsElement  : (arr, element)=> (Arrays.containsElements(arr, [element])),
	containsElements : (arr, elements, all=true)=> ((all) ? elements.every((element)=> (arr.indexOf(element) > -1)) : elements.some((element)=> (arr.indexOf(element) > -1))),
	indexFill        : (len, offset=0)=> (Arrays.indexMap((new Array(len).fill(null))).map((i)=> (i + offset))),
	indexMap         : (arr)=> (arr.map((element, i)=> (i))),
	isEmpty          : (arr)=> (arr.length === 0),
	randomElement    : (arr)=> (arr[arr.randomIndex()]),
	randomIndex      : (arr)=> (Maths.randomInt(0, arr.length - 1)),
	shuffle          : (arr)=> {
		let indexes = Arrays.indexMap(arr);
		indexes.forEach((element, i)=> {
			const ind = (arr.length - 1) - i;
			Arrays.swapAtIndexes(indexes, (ind > 0) ? Maths.randomInt(0, ind - 1) : Arrays.randomIndex(indexes), ind);
		});

		return (indexes.map((ind)=> (arr[ind])));
	},
	swapAtIndexes    : (arr, i, ii)=> {
		const swap = arr[i];
		arr[i] = arr[ii];
		arr[ii] = swap;
	},
	wrapElement      : (arr, ind)=> (arr[Arrays.wrapIndex(arr, ind)]),
	wrapIndex        : (arr, ind)=> (Maths.wrap(ind, arr.length - 1))
};


export const Bits = {
	contains : (val, bit)=> (((val & bit) === bit)),
	random   : ()=> (Bools.random() << 0)
};


export const Bools = {
	plusMinus : (bool=true)=> (((bool << 0) * 2) - 1),
	random    : ()=> (Maths.coinFlip())
};


export const Browsers = {
	clipboardCopy : (str)=> {
// 		navigator.clipboard.writeText(str);
		const txtArea = document.createElement('textarea');
		txtArea.innerText = str;
		document.body.appendChild(txtArea);
		txtArea.select();
		document.execCommand('copy');
		txtArea.remove();
	},
	isMobile     : {
		Android    : ()=> (navigator.userAgent.match(/Android/i)),
		BlackBerry : ()=> (navigator.userAgent.match(/BlackBerry/i)),
		iOS        : ()=> (navigator.userAgent.match(/iPhone|iPad|iPod/i)),
		Opera      : ()=> (navigator.userAgent.match(/Opera Mini/i)),
		Windows    : ()=> (navigator.userAgent.match(/IEMobile|WPDesktop/i)),
		ANY        : ()=> (Browsers.isMobile.Android() || Browsers.isMobile.iOS() || Browsers.isMobile.Windows() || Browsers.isMobile.Opera() || Browsers.isMobile.BlackBerry())
	},
	makeDownload : (url, blank=false)=> {
		let link = document.createElement('a');
		link.target = (blank) ? '_blank' : '_self';
		link.href = url;
		link.download = url.split('/').pop();
		document.body.appendChild(link);
		link.click();
		link.remove();
	},
	scrollElement : (element, coords={ x : 0, y : 0 })=> {
		if (element) {
			element.scrollTo(coords.x, coords.y);
		}
	},
	scrollOrigin : (element)=> (Browsers.scrollElement(element))
};


export const Components = {
	componentName     : (component)=> (component.constructor.name),
	txtFieldClassName : (valid)=> (`input-wrapper${(valid) ? '' : ' input-wrapper-error'}`)
};


export const DateTimes = {
	currYear       : ()=> (new Date().getFullYear()),
	durationFormat : (secs, frmt='mm:ss')=> {
		const hours = '' + ((secs / 3600) << 0);
		const mins = '' + ((secs - ((hours * 3600)) / 60) << 0);
		secs -= '' + (mins * 60);

		return (frmt.split('').map((char, i)=> {
			if (char === 'm') {
				return ((i < mins.length) ? mins.split('').reverse()[i] : '0');

			} else if (char === 's') {
				return ((i < secs.length) ? secs.split('').reverse()[i] : '0');

			} else {
				return (char);
			}
		}).reverse().join(''));
	},
	ellipsis       : ()=> (Array((DateTimes.epoch() % 4) + 1).join('.')),
	epoch          : (millisecs=false)=> ((millisecs) ? (new Date()).getTime() : ((new Date()).getTime() * 0.001) << 0),
	isLeapYear     : (date=new Date())=> ((date.getFullYear() % 4 === 0) && ((date.getFullYear() % 100 !== 0) || (date.getFullYear() % 400 === 0))),
	iso8601        : (date=new Date())=> (`${date.getFullYear()}-${Strings.lPad(date.getMonth(), 2, '0')}-${Strings.lPad(date.getDate(), 2, '0')}T${Strings.lPad(date.getHours(), 2, '0')}:${Strings.lPad(date.getMinutes(), 2, '0')}:${Strings.lPad(date.getSeconds(), 2, '0')}${(date.getTimezoneOffset() === 0) ? 'Z' : date.toTimeString().split(' ')[1].replace(/^.+(.\d{4})/, '$1')}`),
	secsDiff       : (date1, date2=new Date())=> (Math.abs(date1.getTime() - date2.getTime()))
};


export const Files = {
	basename     : (path)=> (path.split('/').pop()),
	dirname      : (path)=> (path.split('/').slice(0, -2).pop()),
	extension    : (path)=> (path.split('.').pop()),
	filename     : (path, sep='.')=> (Files.basename(path).split(sep).slice(0, -1).join(sep)),
	truncateName : (path, len)=> (`${Strings.truncate(Files.filename(path).split('').slice(0, -2).join(''), len - 2)}${Files.filename(path).split('').slice(-2).join('')}.${Files.extension(path)}`)
};


export const Maths = {
	coinFlip    : (range=100)=> (Maths.randomInt(range * -0.5, range * 0.5) >= 0),
	clamp       : (val, lower, upper)=> (Math.min(Math.max(val, lower), upper)),
	cube        : (val)=> (Math.pow(val, 3)),
	diceRoll    : (sides=6)=> (Maths.randomInt(1, sides)),
	geom        : {
		cropFrame            : (srcFrame, cropFrame)=> ({
			origin : {
				x : Math.max(srcFrame.origin.x, cropFrame.origin.x),
				y : Math.max(srcFrame.origin.y, cropFrame.origin.y)
			},
			size   : {
				width  : Math.min(srcFrame.origin.x + srcFrame.size.width, cropFrame.origin.x + cropFrame.size.width) - Math.max(srcFrame.origin.x, cropFrame.origin.x),
				height : Math.min(srcFrame.origin.y + srcFrame.size.height, cropFrame.origin.y + cropFrame.size.height) - Math.max(srcFrame.origin.y, cropFrame.origin.y)
			}
		}),
		frameContainsFrame   : (frame1, frame2)=> (Maths.geom.rectContainsRect(Maths.geom.frameToRect(frame1), Maths.geom.frameToRect(frame2))),
		frameIntersectsFrame : (frame1, frame2)=> (Maths.geom.rectIntersectsRect(Maths.geom.frameToRect(frame1), Maths.geom.frameToRect(frame2))),
		frameToRect          : (frame)=> ({
			top    : frame.origin.y,
			left   : frame.origin.x,
			bottom : frame.origin.y + frame.size.height,
			right  : frame.origin.x + frame.size.width
		}),
		intersectionRect     : (rect1, rect2)=> ({
			top    : Math.max(rect1.top, rect2.top),
			left   : Math.max(rect1.left, rect2.left),
			bottom : Math.min(rect1.bottom, rect2.bottom),
			right  : Math.min(rect1.right, rect2.right)
		}),
		isSizeDimensioned    : (size, flag=0x11)=> (size.width !== 0 && size.height !== 0),
		lineMidpoint         : (pt1, pt2)=> ({ x : pt1.x + ((pt2.x - pt1.x) * 0.5), y : pt1.y + ((pt2.y - pt1.y) * 0.5) }),
		ptAngle              : (pt1, pt2)=> (Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x)),
		ptDistance           : (pt1, pt2)=> (Math.sqrt(Maths.square(Math.abs(pt2.x - pt1.x)) + Maths.square(Math.abs(pt2.y - pt1.y)))),
		rectContainsRect     : (rect1, rect2)=> (rect1.top <= rect2.top && rect1.left <= rect2.left && rect1.right >= rect2.right && rect1.bottom >= rect2.bottom),
		rectIntersectsRect   : (rect1, rect2)=> (Math.max(rect1.left, rect2.left) < Math.min(rect1.right, rect2.right) && Math.max(rect1.top, rect2.top) < Math.min(rect1.bottom, rect2.bottom)),
		rectToFrame          : (rect)=> ({
			origin : {
				x : rect.left,
				y : rect.top
			},
			size   : {
				width  : rect.right - rect.left,
				height : rect.bottom - rect.top
			}
		}),
		sizeArea             : (size)=> (size.width * size.height),
		sizeOutboundsSize    : (size1, size2)=> (size1.width > size2.width || size1.height > size2.height),
		slope                : (pt1, pt2)=> ({ x : pt2.x - pt1.x, y : pt2.y - pt1.y }),
	},
	factorial   : (val)=> (Arrays.indexFill(val, 1).reverse().reduce((acc, val)=> (acc * val))),
	half        : (val)=> (val * 0.5),
	quarter     : (val)=> (val * 0.25),
	randomFloat : (lower, upper, precision=15)=> ((Math.random() * (upper - lower)) + lower).toFixed(precision),
	randomInt   : (lower, upper)=> (Math.round(Maths.randomFloat(lower, upper))),
	reciprocal  : (val)=> (1 / val),
	root        : (val, root)=> (Math.pow(val, Maths.reciprocal(root))),
	square      : (val)=> (Math.pow(val, 2)),
	toDegrees   : (val)=> (val * (180 / Math.PI)),
	toRadians   : (val)=> (val * (Math.PI / 180)),
	wrap        : (val, upper=Number.MAX_VALUE - 1, lower=0)=> ((val < lower) ? lower + (((upper + 1) - Math.abs(val)) % (upper + 1)) : lower + (val % (upper + 1)))
};


export const Numbers = {
	commaFormat : (val)=> (val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')),
	isEven      : (val)=> (val % 2 === 0),
	isOdd       : (val)=> (!Numbers.isEven(val)),
	toOrdinal   : (val)=> (`${val}${(val >= 10 && val <= 13) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(4, val % 10)]}`)
};


export const Objects = {
	defineVal  : (obj, key, val)=> (Object.assign({}, obj, { [key] : val })),
	dropKey    : (obj, key)=> (Objects.dropKeys(obj, [key])),
	dropKeys   : (obj, keys)=> ({...Object.keys(obj).filter((k)=> (!Arrays.containsElement(keys, k))).reduce((newObj, k)=> ({...newObj, [k]: obj[k]}), {})}),
	isEmpty    : (obj)=> (Object.keys(obj).length === 0),
	hasKey     : (obj, key)=> (Object.keys(obj).some((k)=> (k === key))),
	length     : (obj)=> (Object.keys(obj).length),
	reduceVals : (obj, init=0)=> (Object.values(obj).reduce((acc, val)=> ((acc << 0) + (val << 0)), init)),
	swapAtKeys : (obj, key1, key2)=> {
		const swap = obj[key1];
		obj[key1] = obj[key2];
		obj[key2] = swap;
	}
};


export const Strings = {
	asciiEncode  : (str, enc='utf8')=> ((new Buffer(str, enc)).toString('ascii')),
	base64Decode : (str, enc='utf8')=> ((new Buffer(str, 'base64')).toString(enc)),
	base64Encode : (str, enc='ascii')=> ((new Buffer(str, enc)).toString('base64')),
	camelize     : (str, separator=' ', propName=false)=> (str.split((separator || ' ')).map((word, i)=> (word.replace(/^./, (c)=> ((!propName && i === 0) ? c.toLowerCase() : c.toUpperCase())))).join('')),
	capitalize   : (str, lower=false)=> (str.replace(/^(\w+)$/gi, (c)=> ((lower) ? c.toLowerCase() : c)).replace(/(\b\w)/gi, (c)=> (c.toUpperCase()))),
	countOf      : (str, substr)=> ((str.match(new RegExp(substr.toString(), 'g')) || []).length),
	dropChar     : (str, char)=> (Strings.replAll(str, char)),
	firstChar    : (str)=> (str.charAt(0)),
	isEmail      : (str)=> (/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(String(str))),
	lastChar     : (str)=> (str.slice(-1)),
	lPad         : (str, amt, char)=> ((String(str).length < amt) ? `${(new Array(amt - String(str).length + 1)).join(char)}${str}` : str),
	indexedVal   : (val, arr, divider='_')=> {
		if (arr[val].length === 0) {
			arr[val] = 0;
		}

		return ({
			name : `${val}${divider}${++arr[val]}`,
			arr : [...arr]
		});
	},
	pluralize   : (str, val)=> ((val === 1) ? str : (Strings.lastChar(str) === 'y') ? `${str.slice(0, -1)}ies` : (Strings.lastChar(str) === 's') ? 'es' : `${str}s`),
	remove      : (str, needle)=> (Strings.replAll(str, needle)),
	repeat      : (str='', amt=1)=> ((new Array(amt)).fill(str).join('')),
	replAll     : (str, needle, replacement='')=> (str.split(needle).join(replacement)),
	reverse     : (str)=> ([...str].reverse().join('')),
	randAlpha   : (len=1, cases=true)=> (Arrays.indexFill(len).map((i)=> ((cases && Maths.coinFlip()) ? String.fromCharCode(Maths.randomInt(65, 91)).toLowerCase() : String.fromCharCode(Maths.randomInt(65, 91)))).join('')),
	rPad        : (str, amt, char)=> ((str.length < amt) ? `${str}${(new Array(amt - String(str).length + 1)).join(char)}` : str),
	shuffle     : (str)=> (Arrays.shuffle([...str.split('')]).join('')),
	slugifyURI  : (str)=> (str.trim().replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '').toLowerCase()),
	trimSlashes : (str, leading=true, trailing=true)=> (str.replace(((leading && trailing) ? /^\/?(.+)\// : (leading && !trailing) ? /^\/(.+)$/ : (!leading && trailing) ? /^(.+)\/$/ : /^(.+)$/), '$1')),
	truncate    : (str, len, ellipsis='…')=> ((str.length > len) ? `${str.substring(0, len - 1).trim()}${ellipsis}` : str),
	utf8Encode  : (str, enc='ascii')=> ((new Buffer(str, enc)).toString('utf8'))
};


export const URLs = {
	firstComponent : (url=window.location.pathname)=> (url.substr(1).split('/').shift()),
	hostname       : (url=window.location.hostname)=> (url.replace(/^https?:\/\//g, '').split('/').shift()),
	lastComponent  : (url=window.location.pathname)=> (Files.filename(url, '')),
	protocol       : (url=window.location.protocol)=> ((/^https?/.test(url.toLowerCase())) ? url.split(':').shift() : null),
	subdomain      : (url=window.location.hostname)=> ((URLs.hostname(url).split('.').length === 3) ? URLs.hostname(url).split('.').shift() : null),
	tdl            : (url=window.location.hostname)=> (URLs.hostname(url).split('.').pop())
};


/* …\(^_^)/… */