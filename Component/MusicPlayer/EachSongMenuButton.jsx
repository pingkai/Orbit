
import { Pressable, findNodeHandle, UIManager } from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRef } from "react";

export const EachSongMenuButton = ({ Onpress }) => {
  const buttonRef = useRef(null);

  const handlePress = () => {
    if (buttonRef.current) {
      const handle = findNodeHandle(buttonRef.current);
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        Onpress({ pageY: pageY + (height * 2) });
      });
    }
  };
  return (
    <Pressable 
      ref={buttonRef}
      onPress={handlePress}
      hitSlop={8}
      style={{
        padding: 8,
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name="dots-vertical" size={24} color="white"/>
    </Pressable>
  );
};
