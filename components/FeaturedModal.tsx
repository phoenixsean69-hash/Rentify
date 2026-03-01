import icons from "@/constants/icons";
import React from "react";
import {
  FlatList,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FeaturedModalProps {
  visible: boolean;
  onClose: () => void;
  properties: any[];
  onPropertyPress: (id: string) => void;
}

const FeaturedModal = ({
  visible,
  onClose,
  properties,
  onPropertyPress,
}: FeaturedModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white mt-20 rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between p-5 border-b border-primary-200">
            <Text className="text-2xl font-rubik-bold text-black-300">
              Featured Properties
            </Text>

            <View className="flex-row items-center">
              <TouchableOpacity onPress={onClose}>
                <Image
                  source={icons.logout}
                  className="size-6"
                  tintColor="#FF3800"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Properties List */}
          <FlatList
            data={properties}
            keyExtractor={(item) => item.$id}
            contentContainerClassName="p-5 pb-10"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onPropertyPress(item.$id);
                }}
                className="flex-row bg-white rounded-xl mb-4 shadow-sm border border-primary-100 overflow-hidden"
              >
                {/* Property Image */}
                <Image
                  source={{ uri: item.image }}
                  className="w-24 h-24"
                  resizeMode="cover"
                />

                {/* Property Details */}
                <View className="flex-1 p-3">
                  <Text
                    className="text-lg font-rubik-bold text-black-300 mb-1"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <View className="flex-row items-center mb-1">
                    <Image
                      source={icons.star}
                      className="size-4"
                      tintColor="#FDB241"
                    />
                    <Text className="text-black-200 text-xs font-rubik ml-1">
                      {item.rating || 4.5} ({item.reviews?.length || 0} reviews)
                    </Text>
                  </View>

                  <Text
                    className="text-black-200 text-xs font-rubik"
                    numberOfLines={1}
                  >
                    {item.address}
                  </Text>

                  <View className="flex-row items-center mt-2">
                    <Text className="text-primary-300 text-base font-rubik-bold">
                      ${item.price}
                    </Text>
                    <Text className="text-black-200 text-xs font-rubik ml-1">
                      /night
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export default FeaturedModal;
