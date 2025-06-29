## Llamada a api que coge makeID y modelID y devuelve un json de como buscarlo


import requests
from urllib3.exceptions import InsecureRequestWarning
import time
import csv

# Suppress only the single InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

cookies = {
    '_csrf': 'b0Kn5SDSuba7CC5i+VF7Bm0GvYNjgKMZWsQi4/Pi6gpAqGTEGYGsgTCY0H44FNZUMsFGYmeTMlyaH4QwtML/kLeR81WitLZ+TbJz+qaD7bg=',
    'didomi_token': 'eyJ1c2VyX2lkIjoiMTkyNDlmYjktYWVhNS02NTBjLWExZjQtMTA5NzJlOGJmY2RmIiwiY3JlYXRlZCI6IjIwMjQtMTAtMDFUMjE6Mjc6NTguOTU0WiIsInVwZGF0ZWQiOiIyMDI0LTEwLTAxVDIxOjI4OjAwLjIyNFoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIiwiYzpnb29nbGVhbmEtNFRYbkppZ1IiXX0sInB1cnBvc2VzIjp7ImVuYWJsZWQiOlsiZGV2aWNlX2NoYXJhY3RlcmlzdGljcyIsImdlb2xvY2F0aW9uX2RhdGEiXX0sInZlbmRvcnNfbGkiOnsiZW5hYmxlZCI6WyJnb29nbGUiXX0sInZlcnNpb24iOjJ9',
    'euconsent-v2': 'CQF0FMAQF0FMAAHABBENBJFsAP_gAEPgAAiQKftV_G__bWlr8X73aftkeY1P9_h77sQxBhfJE-4FzLvW_JwXx2ExNA36tqIKmRIAu3bBIQNlGJDUTVCgaogVryDMaE2coTNKJ6BkiFMRM2dYCF5vm4tj-QKY5vr991dx2B-t7dr83dzyz4VHn3a5_2a0WJCdA5-tDfv9bROb-9IOd_x8v4v8_F_rE2_eT1l_tWvp7D9-cts7_XW89_fff_9Ln_-uB_-_3_gp4ASYaFRAGWBISEGgYQQIAVBWEBFAgAAABIGiAgBMGBTsDAJdYSIAQAoABggBAACDIAEAAAEACEQAQAFAgAAgECgADAAgGAgAIGAAEAFgIBAACA6BimBBAoFgAkZkRCmBCEAkEBLZUIJAECCuEIRZ4BEAiJgoAAAAACsAAQFgsDiSQEqEggS4g2gAAIAEAggAKEEnJgACAM2WoPBk2jK0wDR8wSIaYBkAQAAA.f_wACHwAAAAA',
    'borosTcf': 'eyJwb2xpY3lWZXJzaW9uIjoyLCJjbXBWZXJzaW9uIjoxLCJwdXJwb3NlIjp7ImNvbnNlbnRzIjp7IjEiOnRydWUsIjIiOnRydWUsIjMiOnRydWUsIjQiOnRydWUsIjUiOnRydWUsIjYiOnRydWUsIjciOnRydWUsIjgiOnRydWUsIjkiOnRydWUsIjEwIjp0cnVlfX0sInNwZWNpYWxGZWF0dXJlcyI6eyIxIjp0cnVlfX0=',
    'adit-xandr-id': '4653684307660001020',
    'AMCVS_05FF6243578784B37F000101%40AdobeOrg': '1',
    'ajs_anonymous_id': '732b29af-68eb-419d-b968-f466eadb02b4',
    '_gcl_au': '1.1.464116148.1727818081',
    'AMCV_05FF6243578784B37F000101%40AdobeOrg': '-408604571%7CMCIDTS%7C19998%7CMCMID%7C23286947342458817021030267491651161487%7CMCAAMLH-1728422880%7C6%7CMCAAMB-1728422880%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1727825280s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.6.0',
    '_fbp': 'fb.1.1727818081096.394308593796769280',
    '__gads': 'ID=5695f9e8b2d70c6f:T=1727818081:RT=1727818081:S=ALNI_MaZLpavDzlyem22i2PQA1lEjD-Fhg',
    '__gpi': 'UID=00000f1ce8cb25b5:T=1727818081:RT=1727818081:S=ALNI_MbeoNQfnKXPPSjac_vW3GRnwXL4Sg',
    '__eoi': 'ID=20e0d9f45c6a35fa:T=1727818081:RT=1727818081:S=AA-AfjaPMT3mw3k6j2fvwPKZdYzM',
    '_ga': 'GA1.1.844472816.1727818082',
    '__gsas': 'ID=c831a19ce16fc0ff:T=1727818083:RT=1727818083:S=ALNI_MaVVkFQqXbHM7yxD3ZNQK_8xPREvA',
    'cto_bundle': 'mgh_aF9mWnElMkZ3blVmTG9xbmE2T3ZpNUdXbzVncHExUUI5OG9WJTJGRHBWJTJCTzVLcjlDRksyMGltZDAyZktkakV1TkQ1YUZ2UCUyRmdVYklsMEt4b21TUDdSczlRbkRaaXlrbng2ZXc3Vnp3UFUzTEpnR3Y3OElQY09jTGEwVzF6diUyRnpMcnglMkZTWm9SU3UlMkJ3MFJOV1dPQWNPYkxjdWxKbm9IbzFNd0ZsY2xNSjJ2TXBiVk5LayUzRA',
    'reese84': '3:TE2ABzlH5efO21oUaQukDA==:KaBIJntsqfoOfFM1u8wUb1zioN57WLRKCpZZpANSF5EisSPdbDnxPMc41Ny3LWo7zyqy2+XlYqLCNuSG9cq6G9D9I4rhPCluQ3/021ZGujLiwHax9UtZHLZN1bKqywSoslyelNR4pGXyGA8koyEWtAeZgO9+PS+7ayZqTZahrhm7IsHnG5fusT543+/K7ymKZI41wnLjhfd+7QIzeoBuAYSMIrs3evv8dQa0HMCR+G1X+OjkWGzwP1fBwMspxkpY6toChCBn2ov3Iortxp70K+MnJjUft1edmELWkGAnz2YvjL68+3kZHIHML2lJeHa11C+BJU2J1IVeqDOFqzMA2qJDdmxAu6w3Q75aq5Pa25s0AU4NaUS8SvOd9NiuWdgpWF5DCmv356l9UgL0CW3IqtHMfnRlx0jRWPxw70hdgrhKtFSLVO60Kc/pvpEcKYjoy4hQMD59cda2wcSUWLPuywXakSln9fDzYWf/Z4BbUzoV2dngIWpstEA5jSgD8FurJY+TuewMGPLpCzjjXo6rUw==:wuXBCnY7c6PVUHujvVSZjFdJmaCma3qlrTO0JKmqfXY=',
    '_ga_WYP1WF7F4C': 'GS1.1.1727824940.2.0.1727824940.60.0.0',
}

headers = {
    'Host': 'searchapi.gw.milanuncios.com',
    'Sec-Ch-Ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
    'Sec-Ch-Ua-Platform': '"Linux"',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua-Mobile': '?0',
    'X-Adevinta-Skip-Csrf': 'true',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36',
    'X-Ma-Client': 'WEB',
    'X-Adevinta-Amcvid': '23286947342458817021030267491651161487',
    'Accept': 'application/json, text/plain, */*',
    'X-Adevinta-Session-Id': '732b29af-68eb-419d-b968-f466eadb02b4',
    'X-Adevinta-Euconsent-V2': 'CQF0FMAQF0FMAAHABBENBJFsAP_gAEPgAAiQKftV_G__bWlr8X73aftkeY1P9_h77sQxBhfJE-4FzLvW_JwXx2ExNA36tqIKmRIAu3bBIQNlGJDUTVCgaogVryDMaE2coTNKJ6BkiFMRM2dYCF5vm4tj-QKY5vr991dx2B-t7dr83dzyz4VHn3a5_2a0WJCdA5-tDfv9bROb-9IOd_x8v4v8_F_rE2_eT1l_tWvp7D9-cts7_XW89_fff_9Ln_-uB_-_3_gp4ASYaFRAGWBISEGgYQQIAVBWEBFAgAAABIGiAgBMGBTsDAJdYSIAQAoABggBAACDIAEAAAEACEQAQAFAgAAgECgADAAgGAgAIGAAEAFgIBAACA6BimBBAoFgAkZkRCmBCEAkEBLZUIJAECCuEIRZ4BEAiJgoAAAAACsAAQFgsDiSQEqEggS4g2gAAIAEAggAKEEnJgACAM2WoPBk2jK0wDR8wSIaYBkAQAAA.f_wACHwAAAAA',
    'Origin': 'https://www.milanuncios.com',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://www.milanuncios.com/',
    # 'Accept-Encoding': 'gzip, deflate, br',
    'Priority': 'u=1, i',
    # 'Cookie': '_csrf=b0Kn5SDSuba7CC5i+VF7Bm0GvYNjgKMZWsQi4/Pi6gpAqGTEGYGsgTCY0H44FNZUMsFGYmeTMlyaH4QwtML/kLeR81WitLZ+TbJz+qaD7bg=; didomi_token=eyJ1c2VyX2lkIjoiMTkyNDlmYjktYWVhNS02NTBjLWExZjQtMTA5NzJlOGJmY2RmIiwiY3JlYXRlZCI6IjIwMjQtMTAtMDFUMjE6Mjc6NTguOTU0WiIsInVwZGF0ZWQiOiIyMDI0LTEwLTAxVDIxOjI4OjAwLjIyNFoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIiwiYzpnb29nbGVhbmEtNFRYbkppZ1IiXX0sInB1cnBvc2VzIjp7ImVuYWJsZWQiOlsiZGV2aWNlX2NoYXJhY3RlcmlzdGljcyIsImdlb2xvY2F0aW9uX2RhdGEiXX0sInZlbmRvcnNfbGkiOnsiZW5hYmxlZCI6WyJnb29nbGUiXX0sInZlcnNpb24iOjJ9; euconsent-v2=CQF0FMAQF0FMAAHABBENBJFsAP_gAEPgAAiQKftV_G__bWlr8X73aftkeY1P9_h77sQxBhfJE-4FzLvW_JwXx2ExNA36tqIKmRIAu3bBIQNlGJDUTVCgaogVryDMaE2coTNKJ6BkiFMRM2dYCF5vm4tj-QKY5vr991dx2B-t7dr83dzyz4VHn3a5_2a0WJCdA5-tDfv9bROb-9IOd_x8v4v8_F_rE2_eT1l_tWvp7D9-cts7_XW89_fff_9Ln_-uB_-_3_gp4ASYaFRAGWBISEGgYQQIAVBWEBFAgAAABIGiAgBMGBTsDAJdYSIAQAoABggBAACDIAEAAAEACEQAQAFAgAAgECgADAAgGAgAIGAAEAFgIBAACA6BimBBAoFgAkZkRCmBCEAkEBLZUIJAECCuEIRZ4BEAiJgoAAAAACsAAQFgsDiSQEqEggS4g2gAAIAEAggAKEEnJgACAM2WoPBk2jK0wDR8wSIaYBkAQAAA.f_wACHwAAAAA; borosTcf=eyJwb2xpY3lWZXJzaW9uIjoyLCJjbXBWZXJzaW9uIjoxLCJwdXJwb3NlIjp7ImNvbnNlbnRzIjp7IjEiOnRydWUsIjIiOnRydWUsIjMiOnRydWUsIjQiOnRydWUsIjUiOnRydWUsIjYiOnRydWUsIjciOnRydWUsIjgiOnRydWUsIjkiOnRydWUsIjEwIjp0cnVlfX0sInNwZWNpYWxGZWF0dXJlcyI6eyIxIjp0cnVlfX0=; adit-xandr-id=4653684307660001020; AMCVS_05FF6243578784B37F000101%40AdobeOrg=1; ajs_anonymous_id=732b29af-68eb-419d-b968-f466eadb02b4; _gcl_au=1.1.464116148.1727818081; AMCV_05FF6243578784B37F000101%40AdobeOrg=-408604571%7CMCIDTS%7C19998%7CMCMID%7C23286947342458817021030267491651161487%7CMCAAMLH-1728422880%7C6%7CMCAAMB-1728422880%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1727825280s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.6.0; _fbp=fb.1.1727818081096.394308593796769280; __gads=ID=5695f9e8b2d70c6f:T=1727818081:RT=1727818081:S=ALNI_MaZLpavDzlyem22i2PQA1lEjD-Fhg; __gpi=UID=00000f1ce8cb25b5:T=1727818081:RT=1727818081:S=ALNI_MbeoNQfnKXPPSjac_vW3GRnwXL4Sg; __eoi=ID=20e0d9f45c6a35fa:T=1727818081:RT=1727818081:S=AA-AfjaPMT3mw3k6j2fvwPKZdYzM; _ga=GA1.1.844472816.1727818082; __gsas=ID=c831a19ce16fc0ff:T=1727818083:RT=1727818083:S=ALNI_MaVVkFQqXbHM7yxD3ZNQK_8xPREvA; cto_bundle=mgh_aF9mWnElMkZ3blVmTG9xbmE2T3ZpNUdXbzVncHExUUI5OG9WJTJGRHBWJTJCTzVLcjlDRksyMGltZDAyZktkakV1TkQ1YUZ2UCUyRmdVYklsMEt4b21TUDdSczlRbkRaaXlrbng2ZXc3Vnp3UFUzTEpnR3Y3OElQY09jTGEwVzF6diUyRnpMcnglMkZTWm9SU3UlMkJ3MFJOV1dPQWNPYkxjdWxKbm9IbzFNd0ZsY2xNSjJ2TXBiVk5LayUzRA; reese84=3:TE2ABzlH5efO21oUaQukDA==:KaBIJntsqfoOfFM1u8wUb1zioN57WLRKCpZZpANSF5EisSPdbDnxPMc41Ny3LWo7zyqy2+XlYqLCNuSG9cq6G9D9I4rhPCluQ3/021ZGujLiwHax9UtZHLZN1bKqywSoslyelNR4pGXyGA8koyEWtAeZgO9+PS+7ayZqTZahrhm7IsHnG5fusT543+/K7ymKZI41wnLjhfd+7QIzeoBuAYSMIrs3evv8dQa0HMCR+G1X+OjkWGzwP1fBwMspxkpY6toChCBn2ov3Iortxp70K+MnJjUft1edmELWkGAnz2YvjL68+3kZHIHML2lJeHa11C+BJU2J1IVeqDOFqzMA2qJDdmxAu6w3Q75aq5Pa25s0AU4NaUS8SvOd9NiuWdgpWF5DCmv356l9UgL0CW3IqtHMfnRlx0jRWPxw70hdgrhKtFSLVO60Kc/pvpEcKYjoy4hQMD59cda2wcSUWLPuywXakSln9fDzYWf/Z4BbUzoV2dngIWpstEA5jSgD8FurJY+TuewMGPLpCzjjXo6rUw==:wuXBCnY7c6PVUHujvVSZjFdJmaCma3qlrTO0JKmqfXY=; _ga_WYP1WF7F4C=GS1.1.1727824940.2.0.1727824940.60.0.0',
}
output_file = "dictionaryCochesNetMilanunciosModelos.csv"
with open("modelsCochesNet.csv", 'r') as infile, open(output_file, 'w', newline='') as outfile:
    reader = csv.reader(infile)
    writer = csv.writer(outfile)
    writer.writerow(["cochesNetMarcaId", "cochesNetModeloId", "milanunciosMarcaId", "milanunciosModeloId", "wallapopMarcaId", "wallapopModeloId"])
    next(reader, None)
    for row in reader:
        makeid = row[0]
        modelId = row[1]

        marcaId = makeid
        modeloId = modelId
        params = {
            'marca': marcaId,
            'modelo': modeloId,
        }

        response = requests.get(
            'https://searchapi.gw.milanuncios.com/v1/search-urls/coches-de-segunda-mano',
            params=params,
            cookies=cookies,
            headers=headers,
            verify=False,
        )

        marca = response.json().get("search").get("filters").get("brand")
        if marca is None:
            marca = "None"
        modelo = response.json().get("search").get("filters").get("model")
        if modelo is None:
            modelo = "None"
        writer.writerow([marcaId, modeloId, marca, modelo, marca, modelo])
        print("Procesado modelo: ", row[2])
