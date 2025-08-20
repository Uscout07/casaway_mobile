import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'info';
};

const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
}) => {
  return (
    <Modal transparent visible={isOpen} animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-xl p-6 w-full max-w-md">
          <View className="flex-row items-center mb-4">
            <MaterialIcons
              name={type === 'danger' ? 'warning' : 'help-outline'}
              size={24}
              color={type === 'danger' ? 'red' : 'orange'}
              className="mr-2"
            />
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
          </View>

          <Text className="text-gray-600 mb-6">{message}</Text>

          <View className="flex-row space-x-3">
            <Pressable
              onPress={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg items-center"
            >
              <Text className="text-gray-700">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg items-center ${
                type === 'danger' ? 'bg-red-600' : 'bg-forest'
              }`}
            >
              <Text className="text-white">
                {type === 'danger' ? 'Delete' : 'Confirm'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmDialog;
