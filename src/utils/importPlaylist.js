import store from '../store';
import Actions from '../actions';
import { s2time } from './timeConverter';
import { videoBaseObject } from '../reducers/video';


export default function importPlaylist(dataString) {
	let dataJSON;

	// Read string from file or URL.
	if (dataString[0] === '{') {
		try {
			dataJSON = JSON.parse(dataString);
		} catch (err) {
			store.dispatch(Actions.error(err));
			return;
		}
	} else if (dataString.indexOf('window.getAudiusPlaylist = function()') !== -1){
		eval(dataString);
		dataJSON = window.getAudiusPlaylist();
	} else {
		store.dispatch(Actions.error('Cannot import - unknown data format'));
	}

	// Parse JSON from Audius export.
	if (dataJSON.AudiusDump) {
		store.dispatch(Actions.importPlayList(dataJSON));
		Object.keys(dataJSON.entities)
			.filter(key => !dataJSON.entities[key].deleted)
			.forEach((key) => {
				store.dispatch(Actions.addSearchResult(dataJSON.entities[key]));
			});
	// Parse JSON from Streamus Export.
	} else if (dataJSON.StreamusDump) {
		const entities = {};
		Object.keys(dataJSON.items).forEach((key) => {
			const itemData = dataJSON.items[key].song;
			entities[itemData.id] = Object.assign({}, videoBaseObject, {
				id: itemData.id,
				title: itemData.title,
				duration: s2time(itemData.duration),
			});
		});
		const playList = dataJSON.playlist.map(key => dataJSON.items[`StreamItems-${key}`].song.id);
		store.dispatch(Actions.importPlayList({
			playList,
			entities,
		}));
		Object.keys(entities).forEach((key) => {
			store.dispatch(Actions.addSearchResult(entities[key]));
		});
	// Throw error when it's none of the above export formats.
	} else {
		store.dispatch(Actions.error('Can not import, this is an unknown format'));
	}

	// Remove dublicats
	store.dispatch(Actions.upgradePlayList());
}


