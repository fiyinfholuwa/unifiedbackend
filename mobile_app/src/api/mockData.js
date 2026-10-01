export const platforms = [
          { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
          { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
          { id: 'whatsapp', name: 'WhatsApp Business', icon: 'logo-whatsapp', color: '#25D366' },
          { id: 'telegram', name: 'Telegram', icon: 'paper-plane', color: '#0088cc' },
          { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#111111' },
          { id: 'twitter', name: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2' },
        ];

        // Mock conversations (each has a platform)
        export const mockConversations = [
          {
            id: 'conv1',
            platform: 'facebook',
            contactName: 'Alice Johnson',
            avatar: 'https://i.pravatar.cc/100?img=5',
            lastMessage: 'Hey, are we still meeting tomorrow?',
            timestamp: '2h ago',
          },
          {
            id: 'conv2',
            platform: 'instagram',
            contactName: 'David Smith',
            avatar: 'https://i.pravatar.cc/100?img=6',
            lastMessage: 'I love your latest post!',
            timestamp: '4h ago',
          },
          {
            id: 'conv3',
            platform: 'whatsapp',
            contactName: 'Maria Garcia',
            avatar: 'https://i.pravatar.cc/100?img=7',
            lastMessage: 'The order is confirmed.',
            timestamp: '1d ago',
          },
          {
            id: 'conv4',
            platform: 'telegram',
            contactName: 'Tech Group',
            avatar: 'https://i.pravatar.cc/100?img=8',
            lastMessage: 'Meeting at 5 PM UTC',
            timestamp: '3d ago',
          },
          {
            id: 'conv5',
            platform: 'facebook',
            contactName: 'Emily Brown',
            avatar: 'https://i.pravatar.cc/100?img=9',
            lastMessage: 'Can you send me the files?',
            timestamp: '5h ago',
          },
          {
            id: 'conv6',
            platform: 'tiktok',
            contactName: 'Maya Wilson',
            avatar: 'https://i.pravatar.cc/100?img=10',
            lastMessage: 'Just sent you a new snap!',
            timestamp: '8m ago',
          },
          {
            id: 'conv7',
            platform: 'twitter',
            contactName: 'Jordan Lee',
            avatar: 'https://i.pravatar.cc/100?img=11',
            lastMessage: 'Thanks for getting back to me.',
            timestamp: '35m ago',
          },
        ];

        // Mock messages per conversation
        export const mockMessages = {
          conv1: [
            { id: 'm1', sender: 'other', text: 'Hey, are we still meeting tomorrow?', timestamp: '2h ago' },
            { id: 'm2', sender: 'me', text: 'Yes, see you at 3 PM.', timestamp: '1h ago' },
          ],
          conv2: [
            { id: 'm3', sender: 'other', text: 'I love your latest post!', timestamp: '4h ago' },
            { id: 'm4', sender: 'me', text: 'Thanks! 🙌', timestamp: '3h ago' },
          ],
          conv3: [
            { id: 'm5', sender: 'other', text: 'The order is confirmed.', timestamp: '1d ago' },
          ],
          conv4: [
            { id: 'm6', sender: 'other', text: 'Meeting at 5 PM UTC', timestamp: '3d ago' },
            { id: 'm7', sender: 'me', text: 'I’ll be there.', timestamp: '2d ago' },
          ],
          conv5: [
            { id: 'm8', sender: 'other', text: 'Can you send me the files?', timestamp: '5h ago' },
          ],
          conv6: [
            { id: 'm9', sender: 'other', text: 'Just sent you a new snap!', timestamp: '8m ago' },
          ],
          conv7: [
            { id: 'm10', sender: 'other', text: 'Thanks for getting back to me.', timestamp: '35m ago' },
            { id: 'm11', sender: 'me', text: 'Happy to help!', timestamp: '30m ago' },
          ],
        };

        export const mockUser = {
          id: 'u1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://i.pravatar.cc/200?img=3',
          bio: 'Unified Messenger user',
        };
      
