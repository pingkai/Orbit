return (
    <View style={{flexDirection: 'row'}}>
      {songs.map((song, index) => (
        <View key={`${song.id}-${index}`} // Added unique key combining id and index
            style={{marginRight: 10}}>
          {/* rest of your song rendering */}
        </View>
      ))}
    </View>
  );