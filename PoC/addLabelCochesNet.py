import pandas as pd

# Load the second CSV file
df2 = pd.read_csv('dictionaryCochesNetMilanunciosMarcas.csv')

# Move the label column to the first position
df2 = df2[['label'] + df2.columns.drop('label').tolist()]

# save the merged DataFrame to a new CSV file
df2.to_csv('merged_data.csv', index=False)