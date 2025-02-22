import { EachPlaylistCard } from "../Global/EachPlaylistCard";
import { View } from "react-native";

export const RenderTopCharts = ({playlist}) => {
  const data = []
  for (let i = 0; i < playlist.length; i = i + 2){
    if (i === playlist.length - 1 && playlist.length % 2 !== 0){
      data.push([playlist[i]])
    }
    else {
      data.push([playlist[i],playlist[i + 1]])
    }
  }
  return (
    <View style={{flexDirection: 'row'}}>
      {data.map((item, index) => (
        <View key={item.id || index} style={{marginRight: 10}}>
          {/* rest of your item rendering */}
        </View>
      ))}
    </View>
  );
};
