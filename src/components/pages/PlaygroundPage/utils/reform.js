import Jimp from 'jimp';
import jsonSize from 'json-size';
import { Images } from 'lang-js-utils';
import moment from 'moment';
import { jsonFormatKB } from '../../../../consts/formats';
import { unzipData } from '../../../../utils/funcs';
import { convertStyles } from './css';

export const reformChildElement = async (element, overwrite = {}) => {
  const { tag_name, html, styles } = element;
  delete element['tag_name'];

  return {
    ...element,
    title: element.title.length === 0 ? tag_name : element.title,
    tagName: tag_name,
    html: await unzipData(html),
    styles: await unzipData(styles),
    path: element.path.split(" ").filter(i => i.length > 0),
    // 		meta    : JSON.parse(element.meta.replace(/"/g, '\'')),
    ...overwrite
  };
};

export const reformComment = (comment, overwrite = {}) => ({
  ...comment,
  position: (typeof comment.position === 'string' &&
  comment.position.charAt(0) === "{"
    ? JSON.parse(comment.position)
    : comment.position) || { x: 0, y: 0 },
  author: {
    id: comment.author.id,
    username: comment.author.username,
    email: comment.author.email,
    avatar: comment.author.avatar
  },
  epoch: comment.added ? (moment.utc(comment.added).valueOf() * 0.001) << 0 : 0,
  timestamp: comment.added
    ? moment(comment.added).add(moment().utcOffset() << 0, 'minute')
    : moment.utc(),
  ...overwrite
});

export const reformComponent = async (component, overwrite = {}) => {
  console.log("reformComponent()", component);
  // 	console.log('reformComponent()', component, Object.keys(component));

  const PLACEHOLDER_FILL = {
    r: 128,
    g: 128,
    b: 128,
    a: 0.0
  };

  let {
    type_id,
    event_type_id,
    node_id,
    title,
    tag_name,
    thumb_data,
    image_data,
    html,
    styles,
    accessibility,
    root_styles,
    meta,
    comments,
  } = component;
  const { width, height } = meta.bounds;
  delete component['type_id'];
  delete component['event_type_id'];
  delete component['node_id'];
  delete component['tag_name'];
  delete component['root_styles'];
  delete component['image_data'];
  delete component['thumb_data'];

  const imageData =
    image_data && image_data.length > 1 ? await unzipData(image_data) : null; //Images.genColor(PLACEHOLDER_FILL, { width, height });
  html = html ? await unzipData(html) : null;
  styles = styles ? JSON.parse(await unzipData(styles)) : null;
  accessibility = accessibility
    ? JSON.parse(await unzipData(accessibility))
    : null;
  const rootStyles = root_styles
    ? convertStyles(JSON.parse(await unzipData(root_styles)))
    : null;

  // 	console.log('META: [%s]', JSON.stringify(meta, null, 2));
  //	console.log('ROOT STYLES:', root_styles);
  // 	console.log('META.BOUNDS:', meta.bounds.height, meta.bounds.width);

  //   console.log('::|::', { id : component.id, imageData }, '::|::');
  //   console.log('::|::', { id : component.id, title, imageData }, '::|::');

  const thumbData =
    thumb_data && thumb_data.length > 1
      ? await unzipData(thumb_data)
      : Images.genColor(PLACEHOLDER_FILL, { width, height });

  const fullSize = imageData
    ? await Jimp.read(imageData).then(async image => {
        const { data, ...size } = image.bitmap;
        return { ...size };
      })
    : { width, height };

  const thumbSize = thumbData
    ? await Jimp.read(thumbData).then(async image => {
        const { data, ...size } = image.bitmap;
        return { ...size };
      })
    : null;

  // 	const thumbImage = (image_data) ? await Jimp.read(imageData).then((image)=> {
  // 		return (image.scaleToFit(Math.min(222, width), Math.min(142, height), Jimp.RESIZE_BICUBIC).quality(COMPONENT_THUMB_QUALITY).getBase64Async(Jimp.MIME_PNG));
  // 	}).catch((error)=> {
  //     console.log('//|\\\\', 'thumbImage()', { imageData, error });
  // 		return (null);
  //   }) : Images.genColor(PLACEHOLDER_FILL, { width : width * COMPONENT_THUMB_SCALE, height : height * COMPONENT_THUMB_SCALE });

  //   const thumbImage = (image_data) ? await Jimp.read(imageData).then((image)=> {
  //     return (image.scaleToFit(Math.min(222, width), Math.min(142, height), Jimp.RESIZE_BICUBIC).quality(COMPONENT_THUMB_QUALITY).getBase64Async(Jimp.MIME_PNG));
  //   }).catch((error)=> {
  //     console.log('//|\\\\', 'thumbImage()', { imageData, error });
  //     return (null);
  //   }) : Images.genColor(PLACEHOLDER_FILL, { width : width * COMPONENT_THUMB_SCALE, height : height * COMPONENT_THUMB_SCALE });

  const reformed = {
    ...component,
    html,
    styles,
    imageData,
    thumbData,
    thumbSize,
    fullSize,
    accessibility,
    typeID: type_id,
    eventTypeID: event_type_id,
    nodeID: node_id,
    title: title.length === 0 ? tag_name : title,
    tagName: tag_name,
    rootStyles: rootStyles
      ? {
          ...rootStyles,
          maxWidth  : width > 0 ? `${width}px` : 'fit-content',
          minHeight : height > 0 ? `${height}px` : 'fit-content',
          minWidth  : width > 0 ? `${width}px` : 'fit-content',
          width     : width > 0 ? `${width}px` : 'fit-content'
        }
      : null,
    comments: comments
      .map(comment => reformComment(comment))
      .sort((i, j) => (i.epoch > j.epoch ? -1 : i.epoch < j.epoch ? 1 : 0)),
    selected: false,
    processed: true, //(html && styles && rootStyles) !== null,
    ...overwrite
  };

  if (imageData && html && styles && rootStyles) {
    console.log('[%s] .::(REFORMED)::.', component.id, { data : { ...reformed, size : jsonFormatKB(reformed) } });

  } else {
    console.log('[%s] .::(INITIAL)::.', component.id, { ...reformed, size : jsonFormatKB(reformed) });
  }

  return { ...reformed, size: jsonSize(reformed) };
};

export const reformPlayground = async (playground, summary=false, team = null, overwrite = {}) => {
  console.log("reformPlayground()", playground);

  const { build_id, team_id, device_id, components, added, last_visited } = playground;
  delete playground['build_id'];
  delete playground['team_id'];
  delete playground['device_id'];
  delete playground['last_visited'];

  const deviceID = device_id;
  const reformed = { ...playground,
    team        : (!playground.team) ? team : playground.team,
    teamID      : team_id << 0,
    buildID     : build_id << 0,  
    deviceID    : device_id << 0,
    components  : (summary) ? components : components.map(async(component)=> (await reformComponent(component))),
    lastVisited : moment(last_visited).utc(),
    added       : (playground.added)
      ? moment(added).add(moment().utcOffset() << 0, 'minute')
      : moment.utc(),
    selected    : false,
    ...overwrite
  };

  return ({ ...reformed, size: jsonSize(reformed) });
};
